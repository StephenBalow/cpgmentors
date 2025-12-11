"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { FileText, CheckSquare, ClipboardList, Download, Trash2, Eye, X, Loader2 } from "lucide-react"
import { useBreadcrumbs } from "@/components/breadcrumb-context"
import { useAuth } from "@/lib/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

type ArtifactSource = "training" | "practice" | "testing"
type FilterTab = "all" | ArtifactSource

interface Artifact {
  id: string
  title: string
  type: "document" | "checklist" | "case-summary" | "results"
  source: ArtifactSource
  date: string
  description: string
  status: "in_progress" | "completed" | "abandoned"
  messages: Message[]
  patientName?: string
  currentStep?: number
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}
interface ConversationRow {
  id: string
  conversation_type: string
  status: string
  current_pathway_step: number
  messages: Message[]
  updated_at: string
  completed_at: string | null
  patient_cases: {
    name: string
  } | null
}

// Map step numbers to readable names
const stepNames: Record<number, string> = {
  1: "Medical Screening",
  2: "Classification",
  3: "Stage Determination",
  4: "Treatment Recommendations",
}

const sourceColors: Record<ArtifactSource, { bg: string; text: string }> = {
  training: { bg: "bg-blue-100", text: "text-blue-700" },
  practice: { bg: "bg-green-100", text: "text-green-700" },
  testing: { bg: "bg-purple-100", text: "text-purple-700" },
}

function getTypeIcon(type: Artifact["type"]) {
  switch (type) {
    case "checklist":
      return <CheckSquare className="h-5 w-5" />
    case "case-summary":
      return <ClipboardList className="h-5 w-5" />
    case "results":
      return <FileText className="h-5 w-5" />
    case "document":
    default:
      return <FileText className="h-5 w-5" />
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

export default function ArtifactsPage() {
  const params = useParams()
  const slug = params.slug as string
  const { setBreadcrumbs } = useBreadcrumbs()
  const { userId, isLoading: authLoading } = useAuth()
  const supabase = createClient()
  
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all")
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // View modal state
  const [viewingArtifact, setViewingArtifact] = useState<Artifact | null>(null)

  // Format CPG name from slug
  const cpgName = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  useEffect(() => {
    setBreadcrumbs([
      { label: 'My CPGs', href: '/my-cpgs' },
      { label: `${cpgName} - Artifacts` },
    ])
  }, [cpgName, setBreadcrumbs])

  // Fetch conversations from database
  useEffect(() => {
    async function fetchConversations() {
      if (!userId || authLoading) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        // First get the CPG ID from the slug
        const { data: cpgData, error: cpgError } = await supabase
          .from('cpg_documents')
          .select('id')
          .ilike('title', `%${slug.replace('-', ' ')}%`)
          .single()
        
        if (cpgError || !cpgData) {
          console.error('Could not find CPG:', cpgError)
          setError('Could not find CPG')
          setIsLoading(false)
          return
        }
        
        // Fetch conversations with patient case info
        const { data, error: convError } = await supabase
          .from('user_conversations')
          .select(`
            id,
            conversation_type,
            status,
            current_pathway_step,
            messages,
            updated_at,
            completed_at,
            patient_cases (
              name
            )
          `)
          .eq('user_id', userId)
          .eq('cpg_id', cpgData.id)
          .in('status', ['in_progress', 'completed'])
          .order('updated_at', { ascending: false })
        
        if (convError) {
          console.error('Error fetching conversations:', convError)
          setError('Failed to load artifacts')
          setIsLoading(false)
          return
        }

        const conversations = data as unknown as ConversationRow[]
        
        // Transform to Artifact format
        const transformedArtifacts: Artifact[] = (conversations || []).map((conv: ConversationRow) => {
          const patientName = conv.patient_cases?.name || 'Unknown Patient'
          const isCompleted = conv.status === 'completed'
          const stepName = stepNames[conv.current_pathway_step] || 'Unknown Step'
          
          // Build description based on status
          let description = ''
          if (conv.conversation_type === 'practice') {
            if (isCompleted) {
              description = 'Completed case - View your clinical reasoning journey'
            } else {
              description = `In progress - ${stepName} step`
            }
          } else if (conv.conversation_type === 'training') {
            description = isCompleted ? 'Completed training module' : `In progress - ${stepName}`
          } else if (conv.conversation_type === 'testing') {
            description = isCompleted ? 'Assessment complete' : 'Assessment in progress'
          }
          
          // Build title
          let title = ''
          if (conv.conversation_type === 'practice') {
            title = `${patientName} - Case Summary`
          } else if (conv.conversation_type === 'training') {
            title = `Training: ${stepName}`
          } else {
            title = 'Assessment Results'
          }
          
          return {
            id: conv.id,
            title,
            type: conv.conversation_type === 'practice' ? 'case-summary' : 
                  conv.conversation_type === 'testing' ? 'results' : 'document',
            source: conv.conversation_type as ArtifactSource,
            date: formatDate(conv.completed_at || conv.updated_at),
            description,
            status: conv.status as "in_progress" | "completed" | "abandoned",
            messages: conv.messages || [],
            patientName: conv.conversation_type === 'practice' ? patientName : undefined,
            currentStep: conv.current_pathway_step,
          }
        })
        
        setArtifacts(transformedArtifacts)
      } catch (err) {
        console.error('Error:', err)
        setError('An error occurred while loading artifacts')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchConversations()
  }, [userId, authLoading, slug, supabase])

  const filteredArtifacts = activeFilter === "all" 
    ? artifacts 
    : artifacts.filter((a) => a.source === activeFilter)

  const tabs: { value: FilterTab; label: string }[] = [
    { value: "all", label: "All" },
    { value: "training", label: "Training" },
    { value: "practice", label: "Practice" },
    { value: "testing", label: "Testing" },
  ]

  // Handle View click
  const handleView = (artifact: Artifact) => {
    setViewingArtifact(artifact)
  }

  // Handle Download click
  const handleDownload = (artifact: Artifact) => {
    // Create a text file with the conversation
    const content = artifact.messages
      .map(msg => `${msg.role === 'assistant' ? 'Sam' : 'You'}:\n${msg.content}\n`)
      .join('\n---\n\n')
    
    const header = `${artifact.title}\n${'='.repeat(artifact.title.length)}\n\nDate: ${artifact.date}\nStatus: ${artifact.status}\n\n${'='.repeat(40)}\n\n`
    
    const blob = new Blob([header + content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${artifact.title.replace(/[^a-z0-9]/gi, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Handle Delete click
  const handleDelete = async (artifact: Artifact) => {
    if (!confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
      return
    }
    
    try {
      const { error } = await supabase
        .from('user_conversations')
        .update({ status: 'abandoned' })
        .eq('id', artifact.id)
      
      if (error) throw error
      
      // Remove from local state
      setArtifacts(prev => prev.filter(a => a.id !== artifact.id))
    } catch (err) {
      console.error('Error deleting:', err)
      alert('Failed to delete artifact')
    }
  }

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">{cpgName} - Your Artifacts</h1>
          <p className="text-muted-foreground mt-1">Saved materials from your learning journey</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">{cpgName} - Your Artifacts</h1>
        <p className="text-muted-foreground mt-1">Saved materials from your learning journey</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeFilter === tab.value ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {activeFilter === tab.value && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Artifact Cards */}
      <div className="flex flex-col gap-3">
        {filteredArtifacts.map((artifact) => (
          <div
            key={artifact.id}
            className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                {getTypeIcon(artifact.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-foreground truncate">{artifact.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full capitalize ${sourceColors[artifact.source].bg} ${sourceColors[artifact.source].text}`}
                  >
                    {artifact.source}
                  </span>
                  {artifact.status === 'in_progress' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                      In Progress
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{artifact.description}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">{artifact.date}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleView(artifact)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-md transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button 
                  onClick={() => handleDownload(artifact)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
                <button 
                  onClick={() => handleDelete(artifact)}
                  className="p-1.5 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredArtifacts.length === 0 && !error && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No artifacts found for this filter.</p>
          <p className="text-sm mt-1">Complete practice cases to see them here!</p>
        </div>
      )}

      {/* View Modal */}
      {viewingArtifact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">{viewingArtifact.title}</h2>
                <p className="text-sm text-muted-foreground">{viewingArtifact.date}</p>
              </div>
              <button 
                onClick={() => setViewingArtifact(null)}
                className="p-2 hover:bg-muted rounded-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              {viewingArtifact.messages.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No messages in this conversation.</p>
              ) : (
                <div className="space-y-4">
                  {viewingArtifact.messages.map((message, index) => (
                    <div 
                      key={message.id || index}
                      className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${
                          message.role === 'assistant' ? 'bg-blue-600' : 'bg-gray-500'
                        }`}
                      >
                        {message.role === 'assistant' ? 'S' : 'Y'}
                      </div>
                      
                      {/* Message */}
                      <div 
                        className={`flex-1 rounded-lg p-3 ${
                          message.role === 'assistant' 
                            ? 'bg-blue-50 text-gray-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-xs text-muted-foreground mb-1">
                          {message.role === 'assistant' ? 'Sam' : 'You'}
                        </p>
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t">
              <button
                onClick={() => handleDownload(viewingArtifact)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button
                onClick={() => setViewingArtifact(null)}
                className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
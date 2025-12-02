'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Send,
  Check,
  Circle,
  ArrowRight,
  ExternalLink,
  Loader2,
  X,
  Play,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useBreadcrumbs } from '@/components/breadcrumb-context';
import { createClient } from '@/lib/supabase/client';
import { useSam } from '@/lib/sam/use-sam';

// Types for patient data from database
interface PatientCaseData {
  id: string;
  name: string;
  age: number;
  occupation: string | null;
  chief_complaint: string;
  duration: string | null;
  onset_type: string | null;
  mechanism_of_injury: string | null;
  aggravating_factors: string[] | null;
  easing_factors: string[] | null;
  relevant_history: string | null;
}

interface PathwayStepData {
  id: string;
  step_number: number;
  pathway_name: string;
}

// Resource data for video player
interface ResourceData {
  id: string;
  title: string;
  video_url: string | null;
  resource_type: string;
}

// Parse [RESOURCE:uuid] markers from message content
function parseResourceMarkers(content: string): { cleanContent: string; resourceIds: string[] } {
  const resourcePattern = /\[RESOURCE:([a-f0-9-]+)\]/gi;
  const resourceIds: string[] = [];
  
  let match;
  while ((match = resourcePattern.exec(content)) !== null) {
    resourceIds.push(match[1]);
  }
  
  // Remove the markers from displayed content
  const cleanContent = content.replace(resourcePattern, '').trim();
  
  return { cleanContent, resourceIds };
}

// ============================================================================
// FIXED: Extract Vimeo video ID AND privacy hash from URL
// Handles: https://vimeo.com/787686635/f9a1e7d0a9
//          Returns: { id: "787686635", hash: "f9a1e7d0a9" }
// ============================================================================
function getVimeoEmbedParams(url: string): { id: string; hash: string | null } | null {
  // Match vimeo.com/NUMBERS optionally followed by /HASH
  const match = url.match(/vimeo\.com\/(\d+)(?:\/([a-zA-Z0-9]+))?/);
  if (!match) return null;
  return { 
    id: match[1], 
    hash: match[2] || null 
  };
}

// Video Player Component
function VideoPlayer({ 
  resource, 
  onClose 
}: { 
  resource: ResourceData; 
  onClose: () => void;
}) {
  const vimeoParams = resource.video_url ? getVimeoEmbedParams(resource.video_url) : null;
  
  if (!vimeoParams) {
    return (
      <div className="rounded-lg border border-border bg-secondary/50 p-4">
        <p className="text-sm text-muted-foreground">Video not available</p>
      </div>
    );
  }
  
  // Build embed URL with privacy hash if present
  const embedUrl = vimeoParams.hash 
    ? `https://player.vimeo.com/video/${vimeoParams.id}?h=${vimeoParams.hash}&badge=0&autopause=0&player_id=0&app_id=58479`
    : `https://player.vimeo.com/video/${vimeoParams.id}?badge=0&autopause=0&player_id=0&app_id=58479`;
  
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Video Header */}
      <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{resource.title}</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1 hover:bg-secondary"
          aria-label="Close video"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {/* Vimeo Embed */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={embedUrl}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
          className="absolute top-0 left-0 w-full h-full"
          title={resource.title}
        />
      </div>
    </div>
  );
}

// Video Offer Button (shown inline when Sam offers a video)
function VideoOfferButton({
  resource,
  onPlay,
}: {
  resource: ResourceData;
  onPlay: () => void;
}) {
  return (
    <button
      onClick={onPlay}
      className="mt-3 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
    >
      <Play className="h-4 w-4" />
      Watch: {resource.title}
    </button>
  );
}

function SamAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
      S
    </div>
  );
}

function PatientCard({
  patient,
  onViewFullCase,
}: {
  patient: PatientCaseData;
  onViewFullCase: () => void;
}) {
  const avatar = patient.name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  const keyFacts = [
    patient.duration,
    patient.mechanism_of_injury ? 'Trauma' : 'No trauma',
    patient.occupation,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-semibold text-primary">
          {avatar}
        </div>
        <div>
          <h3 className="font-medium text-foreground">
            {patient.name}, {patient.age}
          </h3>
        </div>
      </div>
      <p className="mt-3 text-sm italic text-foreground">
        &quot;{patient.chief_complaint}&quot;
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{keyFacts}</p>
      <button
        onClick={onViewFullCase}
        className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline"
      >
        View full case
        <ExternalLink className="h-3 w-3" />
      </button>
    </div>
  );
}

function FullCaseModal({
  patient,
  onClose,
}: {
  patient: PatientCaseData;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-card p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 hover:bg-secondary"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-4 text-xl font-semibold">
          {patient.name}, {patient.age}
        </h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Chief Complaint
            </h3>
            <p className="mt-1 text-foreground">
              &quot;{patient.chief_complaint}&quot;
            </p>
          </div>

          {patient.occupation && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Occupation
              </h3>
              <p className="mt-1 text-foreground">{patient.occupation}</p>
            </div>
          )}

          {patient.duration && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Duration
              </h3>
              <p className="mt-1 text-foreground">{patient.duration}</p>
            </div>
          )}

          {patient.onset_type && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Onset
              </h3>
              <p className="mt-1 text-foreground">{patient.onset_type}</p>
            </div>
          )}

          {patient.mechanism_of_injury && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Mechanism of Injury
              </h3>
              <p className="mt-1 text-foreground">
                {patient.mechanism_of_injury}
              </p>
            </div>
          )}

          {patient.aggravating_factors &&
            patient.aggravating_factors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Aggravating Factors
                </h3>
                <ul className="mt-1 list-inside list-disc text-foreground">
                  {patient.aggravating_factors.map((factor, i) => (
                    <li key={i}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}

          {patient.easing_factors && patient.easing_factors.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Easing Factors
              </h3>
              <ul className="mt-1 list-inside list-disc text-foreground">
                {patient.easing_factors.map((factor, i) => (
                  <li key={i}>{factor}</li>
                ))}
              </ul>
            </div>
          )}

          {patient.relevant_history && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Relevant History
              </h3>
              <p className="mt-1 text-foreground">{patient.relevant_history}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

function PathwayProgress({
  steps,
  currentStep,
  completedSteps,
}: {
  steps: PathwayStepData[];
  currentStep: number;
  completedSteps: number[];
}) {
  const getStatus = (
    stepNumber: number
  ): 'completed' | 'current' | 'upcoming' => {
    if (completedSteps.includes(stepNumber)) return 'completed';
    if (stepNumber === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <h3 className="mb-4 text-sm font-medium text-foreground">
        Pathway Progress
      </h3>
      <div className="flex flex-col gap-0">
        {steps.map((step, index) => {
          const status = getStatus(step.step_number);
          return (
            <div key={step.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                {status === 'completed' ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                ) : status === 'current' ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-primary/10">
                    <ArrowRight className="h-3.5 w-3.5 text-primary" />
                  </div>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-muted-foreground/30">
                    <Circle className="h-2 w-2 text-muted-foreground/30" />
                  </div>
                )}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'h-6 w-0.5',
                      status === 'completed'
                        ? 'bg-emerald-500'
                        : 'bg-muted-foreground/20'
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  'pt-0.5 text-sm',
                  status === 'completed'
                    ? 'text-muted-foreground'
                    : status === 'current'
                    ? 'font-medium text-primary'
                    : 'text-muted-foreground/60'
                )}
              >
                {step.pathway_name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PracticeConversationPage() {
  const params = useParams();
  const slug = params.slug as string;
  const caseId = params.case as string;
  const { setBreadcrumbs } = useBreadcrumbs();

  // Refs for auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Patient and pathway data from database
  const [patientCase, setPatientCase] = useState<PatientCaseData | null>(null);
  const [pathwaySteps, setPathwaySteps] = useState<PathwayStepData[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [showFullCase, setShowFullCase] = useState(false);
  
  // Resource/Video state
  const [resourceCache, setResourceCache] = useState<Record<string, ResourceData>>({});
  const [activeVideo, setActiveVideo] = useState<ResourceData | null>(null);

  // Sam conversation hook
  const {
    messages,
    isLoading: isSamLoading,
    error: samError,
    currentStep,
    completedSteps,
    startConversation,
    sendMessage,
  } = useSam({
    caseId,
    onError: (error) => console.error('Sam error:', error),
  });

  // Format CPG name from slug
  const cpgName = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Fetch resource data by ID (with caching)
  const fetchResource = useCallback(async (resourceId: string): Promise<ResourceData | null> => {
    // Check cache first
    if (resourceCache[resourceId]) {
      return resourceCache[resourceId];
    }
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('external_resources')
        .select('id, title, video_url, resource_type')
        .eq('id', resourceId)
        .single();
      
      if (error || !data) {
        console.error('Error fetching resource:', error);
        return null;
      }
      
      // Cache the result
      setResourceCache(prev => ({ ...prev, [resourceId]: data }));
      return data;
    } catch (err) {
      console.error('Error fetching resource:', err);
      return null;
    }
  }, [resourceCache]);

  // Fetch resources when messages contain resource markers
  useEffect(() => {
    async function fetchResourcesFromMessages() {
      for (const message of messages) {
        if (message.role === 'assistant') {
          const { resourceIds } = parseResourceMarkers(message.content);
          for (const resourceId of resourceIds) {
            if (!resourceCache[resourceId]) {
              await fetchResource(resourceId);
            }
          }
        }
      }
    }
    
    fetchResourcesFromMessages();
  }, [messages, resourceCache, fetchResource]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSamLoading, activeVideo]);

  // Fetch patient case and pathway steps
  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();

        // Fetch patient case with all fields for the modal
        const { data: caseData, error: caseError } = await supabase
          .from('patient_cases')
          .select(
            `
            id, name, age, occupation, chief_complaint, duration, 
            onset_type, mechanism_of_injury, aggravating_factors,
            easing_factors, relevant_history, cpg_id
          `
          )
          .eq('id', caseId)
          .single();

        if (caseError) throw caseError;
        setPatientCase(caseData);

        // Fetch pathway steps for this CPG
        if (caseData?.cpg_id) {
          const { data: stepsData, error: stepsError } = await supabase
            .from('cpg_decision_pathways')
            .select('id, step_number, pathway_name')
            .eq('cpg_id', caseData.cpg_id)
            .order('step_number', { ascending: true });

          if (stepsError) throw stepsError;
          setPathwaySteps(stepsData || []);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setLoading(false);
      }
    }

    fetchData();
  }, [caseId]);

  // Start conversation when data is loaded
  useEffect(() => {
    if (
      !loading &&
      patientCase &&
      pathwaySteps.length > 0 &&
      messages.length === 0
    ) {
      startConversation();
    }
  }, [loading, patientCase, pathwaySteps, messages.length, startConversation]);

  // Set breadcrumbs
  useEffect(() => {
    if (patientCase) {
      setBreadcrumbs([
        { label: 'My CPGs', href: '/my-cpgs' },
        { label: `${cpgName} - Practice`, href: `/cpg/${slug}/practice` },
        { label: patientCase.name },
      ]);
    }
  }, [cpgName, patientCase, slug, setBreadcrumbs]);

  // Handle sending a message
  const handleSend = async () => {
    if (!inputValue.trim() || isSamLoading) return;
    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Allow Shift+Enter for new line (default textarea behavior)
  };

  // Render a message with resource handling
  const renderMessageContent = (content: string) => {
    const { cleanContent, resourceIds } = parseResourceMarkers(content);
    
    return (
      <>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {cleanContent}
        </p>
        
        {/* Show video offer buttons for any resources in this message */}
        {resourceIds.map(resourceId => {
          const resource = resourceCache[resourceId];
          if (resource && resource.video_url) {
            return (
              <VideoOfferButton
                key={resourceId}
                resource={resource}
                onPlay={() => setActiveVideo(resource)}
              />
            );
          }
          return null;
        })}
      </>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-[calc(100vh-60px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading case...</span>
      </div>
    );
  }

  // Error state
  if (!patientCase) {
    return (
      <div className="flex h-[calc(100vh-60px)] items-center justify-center">
        <p className="text-destructive">Patient case not found</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-[calc(100vh-60px)] gap-6 p-6">
        {/* Conversation Area - Left 60% */}
        <div className="flex w-[60%] flex-col rounded-lg border border-border bg-card">
          {/* Messages Container */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-6"
          >
            <div className="flex flex-col gap-5">
              {messages.map((message) => (
                <div key={message.id} className="flex flex-col">
                  <div
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {message.role === 'assistant' && <SamAvatar />}
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-3 ${
                        message.role === 'assistant'
                          ? 'bg-secondary text-secondary-foreground'
                          : 'border-2 border-primary/20 bg-card text-foreground'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <p className="mb-1 text-xs font-medium text-primary">
                          Sam
                        </p>
                      )}
                      {message.role === 'assistant' 
                        ? renderMessageContent(message.content)
                        : <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      }
                    </div>
                  </div>
                </div>
              ))}

              {/* Active Video Player */}
              {activeVideo && (
                <div className="my-4">
                  <VideoPlayer 
                    resource={activeVideo} 
                    onClose={() => setActiveVideo(null)} 
                  />
                </div>
              )}

              {/* Loading indicator when Sam is thinking */}
              {isSamLoading && (
                <div className="flex gap-3">
                  <SamAvatar />
                  <div className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Sam is thinking...
                    </span>
                  </div>
                </div>
              )}

              {/* Error display */}
              {samError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  Error: {samError}
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4">
            <div className="flex gap-3">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your response... (Shift+Enter for new line)"
                className="min-h-[44px] max-h-[160px] flex-1 resize-y"
                rows={2}
                disabled={isSamLoading}
              />
              <Button
                size="icon"
                className="shrink-0 self-end"
                onClick={handleSend}
                disabled={isSamLoading || !inputValue.trim()}
              >
                {isSamLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Context Panel - Right 40% */}
        <div className="flex w-[40%] flex-col gap-4 overflow-y-auto">
          {/* Patient Card */}
          <PatientCard
            patient={patientCase}
            onViewFullCase={() => setShowFullCase(true)}
          />

          {/* Pathway Progress */}
          {pathwaySteps.length > 0 && (
            <PathwayProgress
              steps={pathwaySteps}
              currentStep={currentStep}
              completedSteps={completedSteps}
            />
          )}
        </div>
      </div>

      {/* Full Case Modal */}
      {showFullCase && (
        <FullCaseModal
          patient={patientCase}
          onClose={() => setShowFullCase(false)}
        />
      )}
    </>
  );
}
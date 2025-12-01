'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Send, Check, Circle, ArrowRight, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
}

interface PathwayStepData {
  id: string;
  step_number: number;
  pathway_name: string;
}

interface PathwayStep {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'upcoming';
}

function SamAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
      S
    </div>
  );
}

function PatientCard({ patient }: { patient: PatientCaseData }) {
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
      <button className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline">
        View full case
        <ExternalLink className="h-3 w-3" />
      </button>
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
  const getStatus = (stepNumber: number): 'completed' | 'current' | 'upcoming' => {
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
              {/* Connector line and icon */}
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
                {/* Vertical line connector */}
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
              {/* Step label */}
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

  // Patient and pathway data from database
  const [patientCase, setPatientCase] = useState<PatientCaseData | null>(null);
  const [pathwaySteps, setPathwaySteps] = useState<PathwayStepData[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');

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

  // Fetch patient case and pathway steps
  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();

        // Fetch patient case
        const { data: caseData, error: caseError } = await supabase
          .from('patient_cases')
          .select('id, name, age, occupation, chief_complaint, duration, onset_type, mechanism_of_injury, cpg_id')
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
    if (!loading && patientCase && pathwaySteps.length > 0 && messages.length === 0) {
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

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
    <div className="flex h-[calc(100vh-60px)] gap-6 p-6">
      {/* Conversation Area - Left 60% */}
      <div className="flex w-[60%] flex-col rounded-lg border border-border bg-card">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6">
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
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}

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
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <div className="flex gap-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              className="flex-1"
              disabled={isSamLoading}
            />
            <Button 
              size="icon" 
              className="shrink-0"
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
        <PatientCard patient={patientCase} />

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
  );
}

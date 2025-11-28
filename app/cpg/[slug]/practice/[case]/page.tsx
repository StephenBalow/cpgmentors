'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Send, Check, Circle, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useBreadcrumbs } from '@/components/breadcrumb-context';

interface Message {
  id: string;
  sender: 'sam' | 'user';
  content: string;
  options?: string[];
}

interface PatientInfo {
  name: string;
  age: number;
  avatar: string;
  complaint: string;
  keyFacts: string;
}

interface PathwayStep {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'upcoming';
}

const initialMessages: Message[] = [
  {
    id: '1',
    sender: 'sam',
    content:
      "Let's work through Sarah's case together. She's 45, an office worker presenting with \"I can't check my blind spot when backing up my car.\" Symptoms started 3 weeks ago with no trauma. Before we classify her neck pain, we need to screen for red flags. Based on her presentation, are there any red flags present?",
  },
  {
    id: '2',
    sender: 'user',
    content:
      'No history of trauma, no red flags that I can see from the initial presentation',
  },
  {
    id: '3',
    sender: 'sam',
    content:
      "Good clinical thinking! No immediate red flags. Now let's classify her neck pain. Based on her limited rotation and occupation, which classification fits best?",
    options: [
      'Neck pain with mobility deficits',
      'Neck pain with movement coordination impairments (WAD)',
      'Neck pain with headaches',
      'Neck pain with radiating pain',
    ],
  },
];

const patientInfo: PatientInfo = {
  name: 'Sarah Martinez',
  age: 45,
  avatar: 'SM',
  complaint: "I can't check my blind spot when backing up my car",
  keyFacts: '3 weeks • No trauma • Office worker',
};

const pathwaySteps: PathwayStep[] = [
  { id: '1', label: 'Red Flag Screening', status: 'completed' },
  { id: '2', label: 'Classification', status: 'current' },
  { id: '3', label: 'Stage Determination', status: 'upcoming' },
  { id: '4', label: 'Recommendations', status: 'upcoming' },
];

function SamAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
      S
    </div>
  );
}

function MultipleChoiceOptions({
  options,
  selectedOption,
  onSelect,
}: {
  options: string[];
  selectedOption: string | null;
  onSelect: (option: string) => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onSelect(option)}
          className={cn(
            'flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all',
            selectedOption === option
              ? 'border-primary bg-primary/5 text-foreground'
              : 'border-border bg-card text-foreground hover:border-primary/30 hover:bg-secondary/50'
          )}
        >
          <div
            className={cn(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
              selectedOption === option
                ? 'border-primary bg-primary'
                : 'border-muted-foreground/30'
            )}
          >
            {selectedOption === option && (
              <Check className="h-3 w-3 text-primary-foreground" />
            )}
          </div>
          {option}
        </button>
      ))}
    </div>
  );
}

function PatientCard({ patient }: { patient: PatientInfo }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-semibold text-primary">
          {patient.avatar}
        </div>
        <div>
          <h3 className="font-medium text-foreground">
            {patient.name}, {patient.age}
          </h3>
        </div>
      </div>
      <p className="mt-3 text-sm italic text-foreground">
        &quot;{patient.complaint}&quot;
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{patient.keyFacts}</p>
      <button className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline">
        View full case
        <ExternalLink className="h-3 w-3" />
      </button>
    </div>
  );
}

function PathwayProgress({ steps }: { steps: PathwayStep[] }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <h3 className="mb-4 text-sm font-medium text-foreground">
        Pathway Progress
      </h3>
      <div className="flex flex-col gap-0">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-3">
            {/* Connector line and icon */}
            <div className="flex flex-col items-center">
              {step.status === 'completed' ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-3.5 w-3.5" />
                </div>
              ) : step.status === 'current' ? (
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
                    step.status === 'completed'
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
                step.status === 'completed'
                  ? 'text-muted-foreground'
                  : step.status === 'current'
                  ? 'font-medium text-primary'
                  : 'text-muted-foreground/60'
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PracticeConversationPage() {
  const params = useParams();
  const slug = params.slug as string;
  const caseId = params.case as string;
  const { setBreadcrumbs } = useBreadcrumbs();

  const [messages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Format names for display
  const cpgName = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const patientName = caseId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'My CPGs', href: '/my-cpgs' },
      { label: `${cpgName} - Practice`, href: `/cpg/${slug}/practice` },
      { label: patientName },
    ]);
  }, [cpgName, patientName, slug, setBreadcrumbs]);

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
                    message.sender === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  {message.sender === 'sam' && <SamAvatar />}
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 ${
                      message.sender === 'sam'
                        ? 'bg-secondary text-secondary-foreground'
                        : 'border-2 border-primary/20 bg-card text-foreground'
                    }`}
                  >
                    {message.sender === 'sam' && (
                      <p className="mb-1 text-xs font-medium text-primary">
                        Sam
                      </p>
                    )}
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
                {/* Multiple choice options below Sam's message */}
                {message.sender === 'sam' && message.options && (
                  <div className="ml-11">
                    <MultipleChoiceOptions
                      options={message.options}
                      selectedOption={selectedOption}
                      onSelect={setSelectedOption}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <div className="flex gap-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your response..."
              className="flex-1"
            />
            <Button size="icon" className="shrink-0">
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Context Panel - Right 40% */}
      <div className="flex w-[40%] flex-col gap-4 overflow-y-auto">
        {/* Patient Card */}
        <PatientCard patient={patientInfo} />

        {/* Pathway Progress */}
        <PathwayProgress steps={pathwaySteps} />
      </div>
    </div>
  );
}

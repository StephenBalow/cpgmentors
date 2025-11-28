'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBreadcrumbs } from '@/components/breadcrumb-context';

interface Message {
  id: string;
  sender: 'sam' | 'user';
  content: string;
}

const initialMessages: Message[] = [
  {
    id: '1',
    sender: 'sam',
    content:
      "Welcome to Medical Screening! Before we treat any neck pain patient, we need to screen for serious pathology. I'm going to walk you through 13 red flags. Ready to begin?",
  },
  {
    id: '2',
    sender: 'user',
    content: "Yes, let's do it",
  },
  {
    id: '3',
    sender: 'sam',
    content:
      'Great! Red flag #1: Does your patient have any history of trauma or recent injury to the neck? This could indicate fracture or instability.',
  },
];

const redFlags = [
  'History of trauma or recent injury',
  'Age > 50 with new onset pain',
  'History of cancer',
  'Unexplained weight loss',
  'Fever or signs of infection',
  'Progressive neurological deficit',
  'Severe night pain',
  'Bladder/bowel dysfunction',
];

function SamAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
      S
    </div>
  );
}

export default function TrainingConversationPage() {
  const params = useParams();
  const slug = params.slug as string;
  const moduleId = params.module as string;

  const { setBreadcrumbs } = useBreadcrumbs();

  const [messages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');

  // Format names for display
  const cpgName = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const moduleName = moduleId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'My CPGs', href: '/my-cpgs' },
      { label: `${cpgName} - Training`, href: `/cpg/${slug}` },
      { label: moduleName },
    ]);
  }, [cpgName, moduleName, slug, setBreadcrumbs]);

  return (
    <div className="flex h-[calc(100vh-60px)] gap-6 p-6">
      {/* Conversation Area - Left 60% */}
      <div className="flex w-[60%] flex-col rounded-lg border border-border bg-card">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {message.sender === 'sam' && <SamAvatar />}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.sender === 'sam'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'border-2 border-primary/20 bg-card text-foreground'
                  }`}
                >
                  {message.sender === 'sam' && (
                    <p className="mb-1 text-xs font-medium text-primary">Sam</p>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
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
      <div className="flex w-[40%] flex-col rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            Red Flags Reference
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <h3 className="mb-3 text-sm font-medium text-foreground">
              13 Red Flags for Neck Pain
            </h3>
            <ul className="flex flex-col gap-2.5">
              {redFlags.map((flag, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border bg-card">
                    {/* Empty checkbox */}
                  </div>
                  <span className="text-sm text-muted-foreground">{flag}</span>
                </li>
              ))}
              <li className="flex items-start gap-2.5 text-sm text-muted-foreground/60">
                <span className="ml-6">+ 5 more red flags...</span>
              </li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              Screen all 13 before proceeding to treatment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

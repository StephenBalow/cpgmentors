// =============================================================================
// USE SAM HOOK
// =============================================================================
// A React hook that manages the conversation with Sam.
// Handles state, API calls, and message history.
// =============================================================================

import { useState, useCallback } from 'react';
import type { ConversationState, Message, ExternalResource } from '@/lib/sam/system-prompt';

interface UseSamOptions {
  caseId: string;
  onError?: (error: string) => void;
}

interface UseSamReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  resources: ExternalResource[];
  
  // Actions
  startConversation: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  reset: () => void;
  
  // State helpers
  isStepCompleted: (stepNumber: number) => boolean;
  isCurrentStep: (stepNumber: number) => boolean;
}

const initialState: ConversationState = {
  currentStepNumber: 1,
  totalSteps: 4,
  completedSteps: [],
  redFlagsCleared: false,
  classificationSelected: null,
  classificationCorrect: null,
  stageSelected: null,
  stageCorrect: null,
  messages: [],
};

export function useSam({ caseId, onError }: UseSamOptions): UseSamReturn {
  const [conversationState, setConversationState] = useState<ConversationState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resources, setResources] = useState<ExternalResource[]>([]);

  // Start a new conversation (gets Sam's opening message)
  const startConversation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sam/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          message: '',
          conversationState: initialState,
          isFirstMessage: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data = await response.json();
      setConversationState(data.updatedState);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [caseId, onError]);

  // Send a message to Sam
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);

    // Create the user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    // Build the state with user message included
    // This is what we send to the API
    const stateWithUserMessage: ConversationState = {
      ...conversationState,
      messages: [...conversationState.messages, userMessage],
    };

    // Optimistically update UI with user message
    setConversationState(stateWithUserMessage);

    try {
      const response = await fetch('/api/sam/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          message,
          conversationState: stateWithUserMessage,
          isFirstMessage: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      // API returns state with Sam's response added
      setConversationState(data.updatedState);
      
      if (data.resources) {
        setResources(data.resources);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
      
      // Rollback: remove the user message on error
      setConversationState(conversationState);
    } finally {
      setIsLoading(false);
    }
  }, [caseId, conversationState, onError]);

  // Reset the conversation
  const reset = useCallback(() => {
    setConversationState(initialState);
    setError(null);
    setResources([]);
  }, []);

  // Helper to check if a step is completed
  const isStepCompleted = useCallback((stepNumber: number) => {
    return conversationState.completedSteps.includes(stepNumber);
  }, [conversationState.completedSteps]);

  // Helper to check if this is the current step
  const isCurrentStep = useCallback((stepNumber: number) => {
    return conversationState.currentStepNumber === stepNumber;
  }, [conversationState.currentStepNumber]);

  return {
    messages: conversationState.messages,
    isLoading,
    error,
    currentStep: conversationState.currentStepNumber,
    totalSteps: conversationState.totalSteps,
    completedSteps: conversationState.completedSteps,
    resources,
    
    startConversation,
    sendMessage,
    reset,
    
    isStepCompleted,
    isCurrentStep,
  };
}
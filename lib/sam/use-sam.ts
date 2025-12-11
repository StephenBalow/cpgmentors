// =============================================================================
// USE SAM HOOK
// =============================================================================
// A React hook that manages the conversation with Sam.
// Handles state, API calls, and message history.
// =============================================================================
// VERSION HISTORY:
// - December 9, 2025: Added conversation saving (conversationId tracking)
// - December 10, 2025: V2 - Fixed resume behavior (no double messages)
// - December 11, 2025: V3 - Uses real auth user instead of DEMO_USER_ID
// =============================================================================

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import type { ConversationState, Message, ExternalResource } from '@/lib/sam/system-prompt';

interface UseSamOptions {
  caseId: string;
  onError?: (error: string) => void;
  onResume?: (fromStep: number) => void;
}

interface UseSamReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  resources: ExternalResource[];
  conversationId: string | null;
  isResumed: boolean;
  resumedFromStep: number | null;
  
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

export function useSam({ caseId, onError, onResume }: UseSamOptions): UseSamReturn {
  const { userId } = useAuth();
  const [conversationState, setConversationState] = useState<ConversationState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resources, setResources] = useState<ExternalResource[]>([]);
  
  // Conversation tracking
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isResumed, setIsResumed] = useState(false);
  const [resumedFromStep, setResumedFromStep] = useState<number | null>(null);

  // Start a new conversation (gets Sam's opening message)
  // Or resume an existing in-progress conversation
  const startConversation = useCallback(async () => {
    if (!userId) {
      onError?.('Not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsResumed(false);
    setResumedFromStep(null);

    try {
      const response = await fetch('/api/sam/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          userId,  // Now uses real auth user!
          message: '',
          conversationState: initialState,
          conversationId: null,
          isFirstMessage: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data = await response.json();
      
      // Store the conversation ID for future requests
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }
      
      // Handle resumed conversations
      if (data.isResumed) {
        setIsResumed(true);
        setResumedFromStep(data.resumedFromStep || 1);
        onResume?.(data.resumedFromStep || 1);
        
        // When resuming, the API returns empty response string and
        // the full message history in updatedState.messages
        setConversationState(data.updatedState);
      } else {
        // New conversation - response contains the opening message
        setConversationState(data.updatedState);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [caseId, userId, onError, onResume]);

  // Send a message to Sam
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;
    if (!userId) {
      onError?.('Not authenticated');
      return;
    }

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
          userId,  // Now uses real auth user!
          message,
          conversationState: stateWithUserMessage,
          conversationId,
          isFirstMessage: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Update conversationId if returned
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }
      
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
  }, [caseId, userId, conversationState, conversationId, onError]);

  // Reset the conversation
  const reset = useCallback(() => {
    setConversationState(initialState);
    setConversationId(null);
    setIsResumed(false);
    setResumedFromStep(null);
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
    conversationId,
    isResumed,
    resumedFromStep,
    
    startConversation,
    sendMessage,
    reset,
    
    isStepCompleted,
    isCurrentStep,
  };
}
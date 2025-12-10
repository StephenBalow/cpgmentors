// =============================================================================
// USE SAM HOOK
// =============================================================================
// A React hook that manages the conversation with Sam.
// Handles state, API calls, and message history.
// =============================================================================
// UPDATED: December 9, 2025 - Added conversation saving (conversationId tracking)
// =============================================================================

import { useState, useCallback } from 'react';
import type { ConversationState, Message, ExternalResource } from '@/lib/sam/system-prompt';
import { DEMO_USER_ID } from '../constants/user';

interface UseSamOptions {
  caseId: string;
  onError?: (error: string) => void;
  onResume?: () => void;  // NEW: Callback when resuming an existing conversation
}

interface UseSamReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  resources: ExternalResource[];
  conversationId: string | null;  // NEW: Expose conversationId
  isResumed: boolean;             // NEW: Whether we resumed an existing conversation
  
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
  const [conversationState, setConversationState] = useState<ConversationState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resources, setResources] = useState<ExternalResource[]>([]);
  
  // NEW: Track conversation ID for persistence
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isResumed, setIsResumed] = useState(false);

  // Start a new conversation (gets Sam's opening message)
  // Or resume an existing in-progress conversation
  const startConversation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsResumed(false);  // Reset resume flag

    try {
      const response = await fetch('/api/sam/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          userId: DEMO_USER_ID,
          message: '',
          conversationState: initialState,
          conversationId: null,  // NEW: null on start - API will check for existing
          isFirstMessage: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data = await response.json();
      
      // NEW: Store the conversation ID for future requests
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }
      
      // NEW: Handle resumed conversations
      if (data.isResumed) {
        setIsResumed(true);
        onResume?.();  // Notify parent component if needed
      }
      
      setConversationState(data.updatedState);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [caseId, onError, onResume]);

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
          userId: DEMO_USER_ID,  // NEW: Include userId
          message,
          conversationState: stateWithUserMessage,
          conversationId,  // NEW: Include conversationId for persistence
          isFirstMessage: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // NEW: Update conversationId if returned (shouldn't change, but be safe)
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
  }, [caseId, conversationState, conversationId, onError]);

  // Reset the conversation
  // NEW: Also resets conversationId so next start creates fresh conversation
  const reset = useCallback(() => {
    setConversationState(initialState);
    setConversationId(null);  // NEW: Clear conversation ID
    setIsResumed(false);      // NEW: Clear resumed flag
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
    conversationId,  // NEW: Expose for debugging/display if needed
    isResumed,       // NEW: Expose so UI can show "Resuming..." message
    
    startConversation,
    sendMessage,
    reset,
    
    isStepCompleted,
    isCurrentStep,
  };
}
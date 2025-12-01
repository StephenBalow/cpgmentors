// =============================================================================
// SAM CHAT API ROUTE
// =============================================================================
// POST /api/sam/chat
// 
// This route handles the conversation between the PT and Sam.
// It fetches all necessary context from Supabase, builds the prompt,
// and calls the Anthropic API.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { 
  SAM_SYSTEM_PROMPT, 
  buildSamPrompt,
  generateOpeningMessage,
  type PatientCase,
  type PathwayStep,
  type RedFlag,
  type PathwayOutcome,
  type Recommendation,
  type ExternalResource,
  type ConversationState,
  type SamContext,
  type Message,
} from '@/lib/sam/system-prompt';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Request body type
interface ChatRequest {
  caseId: string;
  message: string;
  conversationState: ConversationState;
  isFirstMessage?: boolean;
}

// Response type
interface ChatResponse {
  response: string;
  updatedState: ConversationState;
  shouldAdvanceStep: boolean;
  resources?: ExternalResource[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { caseId, message, conversationState, isFirstMessage } = body;

    // Create Supabase client
    const supabase = await createClient();

    // ---------------------------------------------------------------------
    // FETCH ALL THE DATA SAM NEEDS
    // ---------------------------------------------------------------------

    // 1. Get the patient case with all Guided Autonomy fields
    const { data: patientCase, error: caseError } = await supabase
      .from('patient_cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (caseError || !patientCase) {
      console.error('Error fetching patient case:', caseError);
      return NextResponse.json(
        { error: 'Patient case not found' },
        { status: 404 }
      );
    }

    // 2. Get the pathway steps for this CPG
    const { data: pathwaySteps, error: pathwayError } = await supabase
      .from('cpg_decision_pathways')
      .select('*')
      .eq('cpg_id', patientCase.cpg_id)
      .order('step_number', { ascending: true });

    if (pathwayError || !pathwaySteps?.length) {
      console.error('Error fetching pathway steps:', pathwayError);
      return NextResponse.json(
        { error: 'Pathway steps not found' },
        { status: 404 }
      );
    }

    // 3. Get the current step
    const currentStep = pathwaySteps.find(
      step => step.step_number === conversationState.currentStepNumber
    ) || pathwaySteps[0];

    // 4. Get red flags for this CPG (for Step 1)
    const { data: redFlags } = await supabase
      .from('cpg_red_flags')
      .select('*')
      .eq('cpg_id', patientCase.cpg_id);

    // 5. Get classification options (outcomes for Step 2)
    const classificationStep = pathwaySteps.find(s => s.step_number === 2);
    let classifications: PathwayOutcome[] = [];
    if (classificationStep) {
      const { data } = await supabase
        .from('cpg_pathway_outcomes')
        .select('*')
        .eq('pathway_step_id', classificationStep.id)
        .order('display_order', { ascending: true });
      classifications = data || [];
    }

    // 6. Get stage options (outcomes for Step 3)
    const stageStep = pathwaySteps.find(s => s.step_number === 3);
    let stages: PathwayOutcome[] = [];
    if (stageStep) {
      const { data } = await supabase
        .from('cpg_pathway_outcomes')
        .select('*')
        .eq('pathway_step_id', stageStep.id)
        .order('display_order', { ascending: true });
      stages = data || [];
    }

    // 7. Get recommendations (filtered by classification + stage if known)
    let recommendations: Recommendation[] = [];
    if (conversationState.classificationSelected && conversationState.stageSelected) {
      const { data } = await supabase
        .from('cpg_recommendations')
        .select('*')
        .eq('cpg_id', patientCase.cpg_id)
        .ilike('category', `%${conversationState.classificationSelected}%`)
        .ilike('stage', `%${conversationState.stageSelected}%`)
        .order('evidence_grade', { ascending: true });
      recommendations = data || [];
    }

    // 8. Get recommended resources for this case
    let resources: ExternalResource[] = [];
    if (patientCase.recommended_resource_ids?.length) {
      const { data } = await supabase
        .from('external_resources')
        .select('id, title, resource_type, summary, video_url, url')
        .in('id', patientCase.recommended_resource_ids);
      resources = data || [];
    }

    // ---------------------------------------------------------------------
    // HANDLE FIRST MESSAGE (Opening)
    // ---------------------------------------------------------------------
    
    if (isFirstMessage) {
      const openingMessage = generateOpeningMessage(
        patientCase as PatientCase,
        pathwaySteps[0]
      );

      const updatedState: ConversationState = {
        ...conversationState,
        currentStepNumber: 1,
        totalSteps: pathwaySteps.length,
        messages: [
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: openingMessage,
            timestamp: new Date(),
          },
        ],
      };

      return NextResponse.json({
        response: openingMessage,
        updatedState,
        shouldAdvanceStep: false,
      });
    }

    // ---------------------------------------------------------------------
    // BUILD CONTEXT AND CALL CLAUDE
    // ---------------------------------------------------------------------

    const context: SamContext = {
      patientCase: patientCase as PatientCase,
      pathwaySteps: pathwaySteps as PathwayStep[],
      currentStep: currentStep as PathwayStep,
      redFlags: (redFlags || []) as RedFlag[],
      classifications,
      stages,
      recommendations,
      resources,
      conversationState,
      userMessage: message,
    };

    const userPrompt = buildSamPrompt(context);

    // The conversationState.messages already includes the user's message
    // (added by use-sam.ts before calling this API)
    // So we use it directly without adding again

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SAM_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract the response text
    const samResponse = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    // ---------------------------------------------------------------------
    // UPDATE CONVERSATION STATE
    // ---------------------------------------------------------------------

    // Add ONLY Sam's response to history (user message is already there from use-sam.ts)
    const updatedMessages: Message[] = [
      ...conversationState.messages,
      {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: samResponse,
        timestamp: new Date(),
      },
    ];

    // Determine if we should advance to next step
    // Check for phrases that indicate step completion
    const lowerResponse = samResponse.toLowerCase();
    const shouldAdvanceStep = 
      lowerResponse.includes("let's move") ||
      lowerResponse.includes("now let's") ||
      lowerResponse.includes("let's move on") ||
      lowerResponse.includes("move to classification") ||
      lowerResponse.includes("move to stage") ||
      lowerResponse.includes("move to treatment") ||
      lowerResponse.includes("proceed to") ||
      lowerResponse.includes("next step") ||
      (lowerResponse.includes("now let") && lowerResponse.includes("classify")) ||
      (lowerResponse.includes("now let") && lowerResponse.includes("determine the stage")) ||
      (lowerResponse.includes("now let") && lowerResponse.includes("treatment")) ||
      (lowerResponse.includes("ready to see what the evidence tells us"));

    // Update step tracking
    const newCurrentStep = shouldAdvanceStep && conversationState.currentStepNumber < pathwaySteps.length
      ? conversationState.currentStepNumber + 1
      : conversationState.currentStepNumber;
    
    const newCompletedSteps = shouldAdvanceStep && conversationState.currentStepNumber < pathwaySteps.length
      ? [...conversationState.completedSteps, conversationState.currentStepNumber]
      : [...conversationState.completedSteps];

    const updatedState: ConversationState = {
      ...conversationState,
      currentStepNumber: newCurrentStep,
      completedSteps: newCompletedSteps,
      totalSteps: pathwaySteps.length,
      messages: updatedMessages,
    };

    // Log for debugging
    console.log('Sam Response:', {
      step: currentStep.pathway_name,
      messageLength: samResponse.length,
      shouldAdvanceStep,
      newCurrentStep,
    });

    return NextResponse.json({
      response: samResponse,
      updatedState,
      shouldAdvanceStep,
      resources: currentStep.step_number === 4 ? resources : undefined,
    });

  } catch (error) {
    console.error('Error in Sam chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
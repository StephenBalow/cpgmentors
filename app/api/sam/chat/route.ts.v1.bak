// =============================================================================
// SAM CHAT API ROUTE
// =============================================================================
// POST /api/sam/chat
// 
// This route handles the conversation between the PT and Sam.
// It fetches all necessary context from Supabase, builds the prompt,
// and calls the Anthropic API.
// =============================================================================
// UPDATED: December 1, 2025 - Added Clinical Tests support for Classification step
// UPDATED: December 1, 2025 - Fixed step transition detection for all 4 steps
// UPDATED: December 9, 2025 - CR-001: Classification/stage reference tables
// UPDATED: December 9, 2025 - Added profiles integration (userId, userName, experienceLevel)
// UPDATED: December 9, 2025 - Added conversation saving to user_conversations
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
  type ClinicalTest,
  type ConversationState,
  type SamContext,
  type Message,
  type UserProfile,
} from '@/lib/sam/system-prompt';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Request body type
interface ChatRequest {
  caseId: string;
  userId: string;
  message: string;
  conversationState: ConversationState;
  conversationId?: string;  // NEW: Track conversation across requests
  isFirstMessage?: boolean;
}

// Response type
interface ChatResponse {
  response: string;
  updatedState: ConversationState;
  shouldAdvanceStep: boolean;
  conversationId: string;  // NEW: Return conversation ID to frontend
  isResumed?: boolean;     // NEW: Tell frontend if we resumed an existing conversation
  resources?: ExternalResource[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { caseId, userId, message, conversationState, conversationId, isFirstMessage } = body;

    // Create Supabase client
    const supabase = await createClient();

    // ---------------------------------------------------------------------
    // FETCH ALL THE DATA SAM NEEDS
    // ---------------------------------------------------------------------

    // 0. Get the user profile for personalization
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, experience_level')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      console.error('Error fetching user profile:', profileError);
    }

    const user: UserProfile = {
      id: userId,
      firstName: userProfile?.first_name || 'there',
      lastName: userProfile?.last_name || null,
      experienceLevel: userProfile?.experience_level || 'experienced',
    };

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

    // =====================================================================
    // CONVERSATION MANAGEMENT (NEW)
    // =====================================================================
    
    let activeConversationId = conversationId;
    let isResumed = false;

    if (isFirstMessage) {
      // Check for existing in_progress or abandoned conversation
      const { data: existingConversation } = await supabase
        .from('user_conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('patient_case_id', caseId)
        .in('status', ['in_progress', 'abandoned'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (existingConversation) {
        // RESUME existing conversation
        activeConversationId = existingConversation.id;
        isResumed = true;

        // Parse the stored messages
        const storedMessages = existingConversation.messages as Message[];
        
        // Build the resumed state
        const resumedState: ConversationState = {
          currentStepNumber: existingConversation.current_pathway_step || 1,
          totalSteps: pathwaySteps.length,
          completedSteps: Array.from({ length: (existingConversation.current_pathway_step || 1) - 1 }, (_, i) => i + 1),
          redFlagsCleared: (existingConversation.current_pathway_step || 1) > 1,
          classificationSelected: null,  // Will be repopulated if they were past step 2
          classificationCorrect: null,
          stageSelected: null,
          stageCorrect: null,
          messages: storedMessages,
        };

        // Update the conversation to mark it as resumed (updates timestamp)
        await supabase
          .from('user_conversations')
          .update({ 
            status: 'in_progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', activeConversationId);

        // Generate a welcome back message
        const welcomeBackMessage = `Welcome back, ${user.firstName}! We were working on ${patientCase.name}'s case. ${
          existingConversation.current_pathway_step === 1 
            ? "Let's continue with the medical screening." 
            : existingConversation.current_pathway_step === 2
            ? "You had completed the red flag screening. Let's continue with classification."
            : existingConversation.current_pathway_step === 3
            ? "You had classified the condition. Let's determine the stage."
            : "You were almost done! Let's finish with treatment recommendations."
        }`;

        // Add welcome back message to the conversation
        const welcomeMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: welcomeBackMessage,
          timestamp: new Date(),
        };

        const updatedMessages = [...storedMessages, welcomeMessage];

        // Save the welcome back message
        await supabase
          .from('user_conversations')
          .update({ 
            messages: updatedMessages,
            updated_at: new Date().toISOString()
          })
          .eq('id', activeConversationId);

        return NextResponse.json({
          response: welcomeBackMessage,
          updatedState: {
            ...resumedState,
            messages: updatedMessages,
          },
          shouldAdvanceStep: false,
          conversationId: activeConversationId,
          isResumed: true,
        });
      } else {
        // CREATE new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('user_conversations')
          .insert({
            user_id: userId,
            cpg_id: patientCase.cpg_id,
            conversation_type: 'practice',
            patient_case_id: caseId,
            messages: [],
            status: 'in_progress',
            current_pathway_step: 1,
          })
          .select()
          .single();

        if (createError || !newConversation) {
          console.error('Error creating conversation:', createError);
          return NextResponse.json(
            { error: 'Failed to create conversation' },
            { status: 500 }
          );
        }

        activeConversationId = newConversation.id;
      }
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

    // 5b. Get clinical tests for this CPG (supports Classification step)
    const { data: tests } = await supabase
      .from('cpg_tests')
      .select('*')
      .eq('cpg_id', patientCase.cpg_id);

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

    // 7. Get recommendations (CR-001 logic)
    let recommendations: Recommendation[] = [];
    
    const { data: universalAndGeneral } = await supabase
      .from('cpg_recommendations')
      .select('*')
      .eq('cpg_id', patientCase.cpg_id)
      .in('recommendation_scope', ['universal', 'general'])
      .order('evidence_grade', { ascending: true });
    
    if (conversationState.classificationSelected && conversationState.stageSelected) {
      const { data: classificationData } = await supabase
        .from('cpg_classifications')
        .select('id')
        .eq('cpg_id', patientCase.cpg_id)
        .eq('name', conversationState.classificationSelected)
        .single();
      
      const { data: stageData } = await supabase
        .from('cpg_stages')
        .select('id')
        .eq('cpg_id', patientCase.cpg_id)
        .eq('name', conversationState.stageSelected)
        .single();
      
      if (classificationData && stageData) {
        const { data: specificRecs } = await supabase
          .from('cpg_recommendations')
          .select('*')
          .eq('cpg_id', patientCase.cpg_id)
          .eq('recommendation_scope', 'specific')
          .eq('classification_id', classificationData.id)
          .eq('stage_id', stageData.id)
          .order('evidence_grade', { ascending: true });
        
        recommendations = [
          ...(universalAndGeneral || []),
          ...(specificRecs || [])
        ];
      } else {
        recommendations = universalAndGeneral || [];
      }
    } else {
      recommendations = universalAndGeneral || [];
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
    // HANDLE FIRST MESSAGE (Opening) - New conversation only
    // ---------------------------------------------------------------------
    
    if (isFirstMessage && !isResumed) {
      const openingMessage = generateOpeningMessage(
        patientCase as PatientCase,
        pathwaySteps[0],
        user
      );

      const initialMessages: Message[] = [
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: openingMessage,
          timestamp: new Date(),
        },
      ];

      // Save the opening message to the conversation
      await supabase
        .from('user_conversations')
        .update({ 
          messages: initialMessages,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeConversationId);

      const updatedState: ConversationState = {
        ...conversationState,
        currentStepNumber: 1,
        totalSteps: pathwaySteps.length,
        messages: initialMessages,
      };

      return NextResponse.json({
        response: openingMessage,
        updatedState,
        shouldAdvanceStep: false,
        conversationId: activeConversationId,
        isResumed: false,
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
      tests: (tests || []) as ClinicalTest[],
      conversationState,
      userMessage: message,
      user,
    };

    const userPrompt = buildSamPrompt(context);

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
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

    const updatedMessages: Message[] = [
      ...conversationState.messages,
      {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: samResponse,
        timestamp: new Date(),
      },
    ];

    // -------------------------------------------------------------------------
    // DETERMINE IF WE SHOULD ADVANCE TO NEXT STEP
    // -------------------------------------------------------------------------
    
    const lowerResponse = samResponse.toLowerCase();

    const step1to2 = 
      lowerResponse.includes("move to classification") ||
      lowerResponse.includes("proceed to classification") ||
      lowerResponse.includes("now let's classify") ||
      lowerResponse.includes("let's classify") ||
      (lowerResponse.includes("no red flags") && lowerResponse.includes("which category")) ||
      (lowerResponse.includes("appropriate for pt") && lowerResponse.includes("classif"));

    const step2to3 = 
      lowerResponse.includes("move to stage") ||
      lowerResponse.includes("determine the stage") ||
      lowerResponse.includes("acute, subacute, or chronic") ||
      lowerResponse.includes("what stage would you") ||
      lowerResponse.includes("classify sarah's condition as") ||
      lowerResponse.includes("classify this as - acute") ||
      lowerResponse.includes("classify her condition as") ||
      lowerResponse.includes("classify his condition as") ||
      (lowerResponse.includes("how long has") && lowerResponse.includes("symptom"));

    const step3to4 = 
      lowerResponse.includes("move to treatment") ||
      lowerResponse.includes("move to recommendation") ||
      lowerResponse.includes("evidence-based interventions") ||
      lowerResponse.includes("what the research tells us") ||
      lowerResponse.includes("treatment priorities") ||
      lowerResponse.includes("what would you recommend") ||
      lowerResponse.includes("final step in our clinical pathway") ||
      (lowerResponse.includes("acute stage") && lowerResponse.includes("intervention"));

    const step4complete = 
      lowerResponse.includes("successfully navigated") ||
      lowerResponse.includes("case summary") ||
      lowerResponse.includes("try another case") ||
      lowerResponse.includes("outstanding work! you've") ||
      lowerResponse.includes("excellent clinical reasoning throughout");

    const genericTransition = 
      lowerResponse.includes("move on to the next clinical decision") ||
      lowerResponse.includes("ready to move on") ||
      lowerResponse.includes("let's proceed to the next");

    const shouldAdvanceStep = step1to2 || step2to3 || step3to4 || step4complete || genericTransition;

    // -------------------------------------------------------------------------
    // UPDATE STEP TRACKING AND CAPTURE SELECTIONS
    // -------------------------------------------------------------------------

    const newCurrentStep = shouldAdvanceStep && conversationState.currentStepNumber < pathwaySteps.length
      ? conversationState.currentStepNumber + 1
      : conversationState.currentStepNumber;
    
    const newCompletedSteps = shouldAdvanceStep && conversationState.currentStepNumber < pathwaySteps.length
      ? [...conversationState.completedSteps, conversationState.currentStepNumber]
      : [...conversationState.completedSteps];

    let newClassificationSelected = conversationState.classificationSelected;
    if (step2to3 && patientCase.expected_classification) {
      newClassificationSelected = patientCase.expected_classification;
    }

    let newStageSelected = conversationState.stageSelected;
    if (step3to4 && patientCase.expected_stage) {
      newStageSelected = patientCase.expected_stage;
    }

    // Determine if case is complete
    const caseComplete = step4complete;
    const newStatus = caseComplete ? 'completed' : 'in_progress';

    const updatedState: ConversationState = {
      ...conversationState,
      currentStepNumber: newCurrentStep,
      completedSteps: newCompletedSteps,
      totalSteps: pathwaySteps.length,
      messages: updatedMessages,
      classificationSelected: newClassificationSelected,
      stageSelected: newStageSelected,
    };

    // =====================================================================
    // SAVE CONVERSATION TO DATABASE
    // =====================================================================
    
    if (activeConversationId) {
      await supabase
        .from('user_conversations')
        .update({
          messages: updatedMessages,
          current_pathway_step: newCurrentStep,
          status: newStatus,
          completed_at: caseComplete ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeConversationId);
    }

    return NextResponse.json({
      response: samResponse,
      updatedState,
      shouldAdvanceStep,
      conversationId: activeConversationId,
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
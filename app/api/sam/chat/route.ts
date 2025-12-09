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

    // 7. Get recommendations
    // CR-001: Now includes universal + general scope (always) plus specific scope (when classification/stage known)
    let recommendations: Recommendation[] = [];
    
    // Step 7a: Always get universal and general recommendations (apply to all patients)
    const { data: universalAndGeneral } = await supabase
      .from('cpg_recommendations')
      .select('*')
      .eq('cpg_id', patientCase.cpg_id)
      .in('recommendation_scope', ['universal', 'general'])
      .order('evidence_grade', { ascending: true });
    
    // Step 7b: If classification + stage are known, also get specific recommendations
    if (conversationState.classificationSelected && conversationState.stageSelected) {
      // Look up the classification_id from reference table
      const { data: classificationData, error: classError } = await supabase
        .from('cpg_classifications')
        .select('id')
        .eq('cpg_id', patientCase.cpg_id)
        .eq('name', conversationState.classificationSelected)
        .single();
      
      // DEBUG
      //console.log('CR-001 Classification lookup:', {
      //  searching: conversationState.classificationSelected,
      //  found: classificationData?.id,
      //  error: classError?.message
      //});
      
      // Look up the stage_id from reference table
      const { data: stageData, error: stageError } = await supabase
        .from('cpg_stages')
        .select('id')
        .eq('cpg_id', patientCase.cpg_id)
        .eq('name', conversationState.stageSelected)
        .single();
      
      // DEBUG
      console.log('CR-001 Stage lookup:', {
        searching: conversationState.stageSelected,
        found: stageData?.id,
        error: stageError?.message
      });
      
      // If we found both, fetch specific recommendations
      if (classificationData && stageData) {
        const { data: specificRecs } = await supabase
          .from('cpg_recommendations')
          .select('*')
          .eq('cpg_id', patientCase.cpg_id)
          .eq('recommendation_scope', 'specific')
          .eq('classification_id', classificationData.id)
          .eq('stage_id', stageData.id)
          .order('evidence_grade', { ascending: true });
        
        // Combine: universal/general first, then specific
        recommendations = [
          ...(universalAndGeneral || []),
          ...(specificRecs || [])
        ];
      } else {
        // Fallback if lookup fails - just use universal/general
        console.warn('CR-001: Could not find classification or stage ID, using universal/general only');
        recommendations = universalAndGeneral || [];
      }
    } else {
      // No classification/stage selected yet - just universal/general
      recommendations = universalAndGeneral || [];
    }

  // CR-001 DEBUG: Log what we're sending to Sam
  //  console.log('CR-001 Recommendations:', {
  //    totalCount: recommendations.length,
  //    classificationSelected: conversationState.classificationSelected,
  //    stageSelected: conversationState.stageSelected
  //  });
    
   // CR-001 DEBUG: Show actual recommendation content being sent
   // console.log('CR-001 Recommendation Details:', JSON.stringify(recommendations, null, 2));

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
      tests: (tests || []) as ClinicalTest[],
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

    // -------------------------------------------------------------------------
    // DETERMINE IF WE SHOULD ADVANCE TO NEXT STEP
    // -------------------------------------------------------------------------
    // Each transition has specific trigger phrases based on how Sam actually talks
    // -------------------------------------------------------------------------
    
    const lowerResponse = samResponse.toLowerCase();

    // Step 1 → 2: Red Flags complete, moving to Classification
    const step1to2 = 
      lowerResponse.includes("move to classification") ||
      lowerResponse.includes("proceed to classification") ||
      lowerResponse.includes("now let's classify") ||
      lowerResponse.includes("let's classify") ||
      (lowerResponse.includes("no red flags") && lowerResponse.includes("which category")) ||
      (lowerResponse.includes("appropriate for pt") && lowerResponse.includes("classif"));

    // Step 2 → 3: Classification complete, moving to Stage
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

    // Step 3 → 4: Stage complete, moving to Recommendations
    const step3to4 = 
      lowerResponse.includes("move to treatment") ||
      lowerResponse.includes("move to recommendation") ||
      lowerResponse.includes("evidence-based interventions") ||
      lowerResponse.includes("what the research tells us") ||
      lowerResponse.includes("treatment priorities") ||
      lowerResponse.includes("what would you recommend") ||
      lowerResponse.includes("final step in our clinical pathway") ||
      (lowerResponse.includes("acute stage") && lowerResponse.includes("intervention"));

    // Step 4 → Complete: Case finished
    const step4complete = 
      lowerResponse.includes("successfully navigated") ||
      lowerResponse.includes("case summary") ||
      lowerResponse.includes("try another case") ||
      lowerResponse.includes("outstanding work! you've") ||
      lowerResponse.includes("excellent clinical reasoning throughout");

    // Generic transition phrases that work for any step
    const genericTransition = 
      lowerResponse.includes("move on to the next clinical decision") ||
      lowerResponse.includes("ready to move on") ||
      lowerResponse.includes("let's proceed to the next");

    const shouldAdvanceStep = step1to2 || step2to3 || step3to4 || step4complete || genericTransition;

 // =============================================================================
// CR-001 OPTION C: CAPTURE CLASSIFICATION/STAGE ON STEP TRANSITIONS
// =============================================================================
//
// INSTRUCTIONS:
// 1. Open app/api/sam/chat/route.ts
// 2. Find the section starting with "// Update step tracking" (around line 322)
// 3. REPLACE from "// Update step tracking" through the "const updatedState" block
// 4. With the code below
//
// This captures the PT's selection when Sam confirms and advances the step.
// =============================================================================

    // -------------------------------------------------------------------------
    // UPDATE STEP TRACKING AND CAPTURE SELECTIONS
    // -------------------------------------------------------------------------
    // CR-001: When Sam advances a step, we know the PT selected correctly.
    // Capture the expected values as the "selected" values for recommendation filtering.
    // -------------------------------------------------------------------------

    const newCurrentStep = shouldAdvanceStep && conversationState.currentStepNumber < pathwaySteps.length
      ? conversationState.currentStepNumber + 1
      : conversationState.currentStepNumber;
    
    const newCompletedSteps = shouldAdvanceStep && conversationState.currentStepNumber < pathwaySteps.length
      ? [...conversationState.completedSteps, conversationState.currentStepNumber]
      : [...conversationState.completedSteps];

    // CR-001: Capture classification when transitioning from Step 2 to Step 3
    let newClassificationSelected = conversationState.classificationSelected;
    if (step2to3 && patientCase.expected_classification) {
      newClassificationSelected = patientCase.expected_classification;
      console.log('CR-001: Captured classification:', newClassificationSelected);
    }

    // CR-001: Capture stage when transitioning from Step 3 to Step 4
    let newStageSelected = conversationState.stageSelected;
    if (step3to4 && patientCase.expected_stage) {
      newStageSelected = patientCase.expected_stage;
      console.log('CR-001: Captured stage:', newStageSelected);
    }

    const updatedState: ConversationState = {
      ...conversationState,
      currentStepNumber: newCurrentStep,
      completedSteps: newCompletedSteps,
      totalSteps: pathwaySteps.length,
      messages: updatedMessages,
      // CR-001: Include captured selections
      classificationSelected: newClassificationSelected,
      stageSelected: newStageSelected,
    };

    // Log for debugging - now includes captured selections
    console.log('Sam Response:', {
      step: currentStep.pathway_name,
      messageLength: samResponse.length,
      shouldAdvanceStep,
      newCurrentStep,
      classificationSelected: newClassificationSelected,
      stageSelected: newStageSelected,
      triggers: { step1to2, step2to3, step3to4, step4complete, genericTransition },
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
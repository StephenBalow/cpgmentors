// =============================================================================
// SAM - AI Clinical Mentor for CPGmentors.com
// =============================================================================
// This file contains:
// 1. The System Prompt (Sam's personality and teaching approach)
// 2. TypeScript interfaces for data structures
// 3. Context builder function for API calls
// 4. API route handler
// =============================================================================
// UPDATED: December 1, 2025 - Added Clinical Tests support for Classification step
// UPDATED: December 2, 2025 - Fixed asterisk formatting, added proactive resource offering
// =============================================================================

// -----------------------------------------------------------------------------
// PART 1: THE SYSTEM PROMPT
// -----------------------------------------------------------------------------
// This is Sam's "soul" - HOW he teaches. The WHAT (pathway steps, red flags,
// classifications, recommendations) comes from the database.
// -----------------------------------------------------------------------------

export const SAM_SYSTEM_PROMPT = `You are Sam, an AI clinical mentor helping physical therapists learn to apply Clinical Practice Guidelines (CPGs) through interactive patient cases.

## YOUR IDENTITY

You are warm, encouraging, and clinically precise. You speak like an experienced colleague who genuinely wants to help PTs become better clinicians. You're not a quiz master or a lecturer - you're a mentor who guides through questions and validation.

## YOUR TEACHING PHILOSOPHY: GUIDED AUTONOMY

You know WHERE the PT should arrive (the correct classification, stage, and recommendations), but you let THEM find the path through clinical reasoning. You:
- Ask questions rather than lecture
- Validate good reasoning with specific praise
- Catch common mistakes with gentle correction
- Explain the "why" behind clinical decisions
- Build confidence through successful reasoning

## HOW YOU USE THE PATHWAY

Each CPG has a sequence of decision steps stored in the database. You will receive:
- The pathway steps for this CPG (in order)
- The current step the PT is on
- The patient case details
- Guided Autonomy data (expected answers, common mistakes, teaching points)

For EACH pathway step:
1. Present the decision point question from that step
2. If there are specific options (like classifications), show them
3. Ask the PT to choose AND explain their reasoning
4. Validate or correct using the Guided Autonomy data
5. When they get it right (or you've helped them understand), advance to the next step

## YOUR VOICE (Inspired by Ryan Schouweiler)

Use these patterns:
- "Good clinical thinking!" (when they're right)
- "That's a common consideration, but..." (when gently correcting)
- "What in the presentation made you think that?" (engaging reasoning)
- "Exactly right! The [specific finding] points us toward..." (validating with specifics)
- "Here's what the evidence tells us..." (citing CPG recommendations)

Adapt to experience level:
- Beginners: More encouragement, simpler explanations, celebrate small wins
- Intermediate: Balanced feedback, introduce nuance, challenge thinking
- Advanced: Colleague-level discussion, complex reasoning, edge cases

## HANDLING EACH STEP TYPE

### Medical Screening (Red Flags)
- Present the patient case
- Ask: "Based on this presentation, are there any red flags present?"
- You have the list of red flags for this CPG - check if any apply
- If PT correctly identifies no red flags → validate and proceed
- If PT incorrectly identifies a red flag → gently correct using red_flag_notes
- If red flags ARE present → explain why this patient needs referral

### Classification
- Ask: "Based on [specific clinical findings], which classification fits best?"
- Show the classification options from cpg_pathway_outcomes
- If correct → validate using classification_reasoning from the patient case
- If incorrect → check common_mistakes for the specific misconception
- Always ask "What made you choose that?" to engage clinical reasoning
- **After classification is selected, discuss supporting clinical tests:**
  - Ask: "What clinical tests might help confirm this classification?"
  - Reference sensitivity/specificity when teaching: "Spurling's test has 93% specificity - a positive result strongly suggests radicular involvement"
  - Connect tests to the case: "Given the dermatomal pattern in this presentation, which special test would you want to perform?"
  - Use tests as teaching moments even if the PT didn't mention them: "Good choice on Mobility Deficits. The cervical flexion-rotation test would help confirm - it has 91% sensitivity for upper cervical restrictions."

### Stage Determination
- Ask: "What stage would you classify this as - acute, subacute, or chronic?"
- Reference the duration criteria:
  - Acute: < 6 weeks
  - Subacute: 6-12 weeks  
  - Chronic: > 12 weeks
- Validate or correct using stage_reasoning from the patient case

### Treatment Recommendations
- Present evidence-graded recommendations matching their classification + stage
- Explain the evidence grades (A = strong, B = moderate, C = weak, F = expert opinion)
- Offer to show relevant technique videos: "Would you like to see how Ryan demonstrates this?"
- Summarize the clinical reasoning journey they just completed

## CRITICAL RULES

1. **This is TRAINING, not real patient care.** Never give advice for actual patients.

2. **Follow the pathway steps in order.** Don't skip steps or jump ahead.

3. **Use the data you're given.** Every case has expected answers, teaching points, and common mistakes. Use them.

4. **Ask "why" after decisions.** Don't just accept answers - engage the reasoning.

5. **One question at a time.** Don't overwhelm. Guide progressively.

6. **Cite evidence grades** when presenting recommendations (A, B, C, F).

7. **Surface resources naturally.** When PT reaches recommendations, offer Ryan's videos: "Want to see how Ryan demonstrates this technique?"

8. **Use clinical tests to reinforce learning.** When discussing classification, reference the diagnostic accuracy of relevant tests to build evidence-based thinking.

## CONVERSATION STARTERS

When beginning a case, introduce it conversationally:
"Let's work through [Patient Name]'s case together. [Brief description of patient and chief complaint]. Before we [first step], let's [what that step does]. [First question]."

## HANDLING EDGE CASES

**If PT asks a question outside the current step:**
"Great question! Let's address that after we complete [current step]. Right now we're focusing on [what current step determines]. [Brief answer if simple, or] We can explore that more once we've worked through the pathway."

**If PT seems stuck:**
"Let me give you a hint: Look at [specific clinical finding from the case]. What does that suggest?"

**If PT wants to change a previous answer:**
"Absolutely - good clinicians revise their thinking as they get more information. What made you reconsider?"

**If PT rushes through without explaining reasoning:**
"Hold on - you got the right answer, but tell me your reasoning. What in [Patient Name]'s presentation led you there?"

**If PT asks about evidence or wants to go deeper:**
"Great instinct to dig into the evidence! [Provide detail from CPG data]. Would you like to see the research that supports this?"

**If PT asks about clinical tests:**
"Excellent question! Clinical tests help us confirm our classification. [Reference specific test with sensitivity/specificity]. This test is particularly useful because [explain diagnostic value]."

## COMPLETING A CASE

When all pathway steps are complete:
1. Congratulate them on working through the case
2. Summarize the key clinical reasoning decisions they made
3. Highlight any teaching points that came up
4. Offer to generate a Case Summary artifact they can save
5. Suggest they try another case or review areas where they hesitated
6. PROACTIVELY offer relevant technique demonstrations:
   - Don't wait for the PT to ask - offer videos as part of the wrap-up
   - Say something like: "Would you like to see how Ryan demonstrates thoracic manipulation for acute mobility deficits?"
   - When offering a specific video resource, include the marker: [RESOURCE:resource_id_here]
   - Example: "I can show you Ryan's technique video on thoracic manipulation. [RESOURCE:abc123-def456-ghi789]"
   - The resource_id should match an id from the available resources provided to you

## REMEMBER

You are not just checking answers. You are building clinical reasoning skills. Every interaction should leave the PT more confident and more capable.

The goal: When they see a real patient like the one in this case, they'll think "I know how to work through this" - because they practiced it with you.`;


// -----------------------------------------------------------------------------
// PART 2: TYPESCRIPT INTERFACES
// -----------------------------------------------------------------------------

// Database row types (match your Supabase tables)
export interface PathwayStep {
  id: string;
  cpg_id: string;
  pathway_name: string;
  step_number: number;
  decision_point: string;
  clinical_reasoning: string | null;
  keywords: string[] | null;
}

export interface RedFlag {
  id: string;
  cpg_id: string;
  condition_name: string;
  clinical_indicators: string;
  action_required: string;
  urgency_level: string;
}

export interface PathwayOutcome {
  id: string;
  pathway_step_id: string;
  condition_type: string;
  condition_text: string;
  outcome_action: string;
  clinical_reasoning: string | null;
  display_order: number;
}

export interface Recommendation {
  id: string;
  cpg_id: string;
  recommendation_text: string;
  evidence_grade: string;
  category: string;  // Classification (e.g., "Mobility Deficits")
  stage: string;     // Acute, Subacute, Chronic, All Stages
  intervention_types: string[] | null;
  keywords: string[] | null;
}

// NEW: Clinical Test interface for diagnostic tests that support classification
export interface ClinicalTest {
  id: string;
  cpg_id: string;
  test_name: string;
  conditions_tested: string;  // Which classification(s) this test supports
  sensitivity: number | null;
  specificity: number | null;
  positive_likelihood_ratio: number | null;
  negative_likelihood_ratio: number | null;
  description: string | null;
  keywords: string[] | null;
}

export interface PatientCase {
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
  
  // Red Flags (Step 1) - Guided Autonomy
  red_flags_present: string[] | null;
  red_flag_notes: string | null;
  
  // Classification (Step 2) - Guided Autonomy
  expected_classification: string;
  classification_reasoning: string;
  
  // Stage (Step 3) - Guided Autonomy
  expected_stage: string;
  stage_reasoning: string;
  
  // Teaching Guidance
  key_clinical_findings: string[] | null;
  teaching_points: string[] | null;
  common_mistakes: string[] | null;
  
  // Resources to surface
  recommended_resource_ids: string[] | null;
  
  // Metadata
  difficulty_level: 'Beginner' | 'Intermediate' | 'Advanced';
  estimated_minutes: number;
  cpg_id: string;
}

export interface ExternalResource {
  id: string;
  title: string;
  resource_type: string;
  summary: string | null;
  video_url: string | null;
  url: string | null;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ConversationState {
  currentStepNumber: number;
  totalSteps: number;
  completedSteps: number[];
  
  // Tracking decisions made
  redFlagsCleared: boolean;
  classificationSelected: string | null;
  classificationCorrect: boolean | null;
  stageSelected: string | null;
  stageCorrect: boolean | null;
  
  // Full conversation history
  messages: Message[];
}


// -----------------------------------------------------------------------------
// PART 3: CONTEXT BUILDER
// -----------------------------------------------------------------------------
// This function assembles all the data Sam needs for each API call
// -----------------------------------------------------------------------------

export interface SamContext {
  patientCase: PatientCase;
  pathwaySteps: PathwayStep[];
  currentStep: PathwayStep;
  redFlags: RedFlag[];
  classifications: PathwayOutcome[];  // Outcomes for classification step
  stages: PathwayOutcome[];           // Outcomes for stage step
  recommendations: Recommendation[];   // Filtered by classification + stage
  resources: ExternalResource[];       // Recommended resources for this case
  tests: ClinicalTest[];              // Clinical tests that support classification
  conversationState: ConversationState;
  userMessage: string;
}

export function buildSamPrompt(context: SamContext): string {
  const {
    patientCase,
    pathwaySteps,
    currentStep,
    redFlags,
    classifications,
    stages,
    recommendations,
    resources,
    tests,
    conversationState,
    userMessage,
  } = context;

  return `
## CURRENT PATIENT CASE
Name: ${patientCase.name}, ${patientCase.age}
Occupation: ${patientCase.occupation || 'Not specified'}
Chief Complaint: "${patientCase.chief_complaint}"
Duration: ${patientCase.duration || 'Not specified'}
Onset: ${patientCase.onset_type || 'Not specified'}
${patientCase.mechanism_of_injury ? `Mechanism of Injury: ${patientCase.mechanism_of_injury}` : 'No trauma mechanism reported'}
${patientCase.aggravating_factors?.length ? `Aggravating Factors: ${patientCase.aggravating_factors.join(', ')}` : ''}
${patientCase.easing_factors?.length ? `Easing Factors: ${patientCase.easing_factors.join(', ')}` : ''}
${patientCase.relevant_history ? `Relevant History: ${patientCase.relevant_history}` : ''}
Difficulty Level: ${patientCase.difficulty_level}

## PATHWAY STEPS FOR THIS CPG
${pathwaySteps.map(step => `Step ${step.step_number}: ${step.pathway_name} - "${step.decision_point}"`).join('\n')}

## CURRENT STEP
Step ${currentStep.step_number} of ${pathwaySteps.length}: ${currentStep.pathway_name}
Decision Point: "${currentStep.decision_point}"
${currentStep.clinical_reasoning ? `Clinical Reasoning Context: ${currentStep.clinical_reasoning}` : ''}

## CPG DATA FOR THIS STEP

${currentStep.step_number === 1 ? `
### RED FLAGS TO SCREEN FOR
${redFlags.map(rf => `- ${rf.condition_name}: ${rf.clinical_indicators} (Urgency: ${rf.urgency_level})`).join('\n')}
` : ''}

${currentStep.step_number === 2 ? `
### CLASSIFICATION OPTIONS
${classifications.map(c => `- ${c.condition_text}`).join('\n')}

### CLINICAL TESTS THAT SUPPORT CLASSIFICATION
These tests help confirm or rule out classifications. Use them in your teaching to reinforce evidence-based reasoning:
${tests.map(t => {
  let testInfo = `- ${t.test_name}: Supports "${t.conditions_tested}"`;
  if (t.sensitivity && t.specificity) {
    testInfo += ` (Sensitivity: ${t.sensitivity}%, Specificity: ${t.specificity}%)`;
  }
  if (t.positive_likelihood_ratio) {
    testInfo += ` [+LR: ${t.positive_likelihood_ratio}]`;
  }
  return testInfo;
}).join('\n')}

**Teaching Tips for Tests:**
- After the PT selects a classification, ask which tests might confirm it
- Use sensitivity/specificity to explain diagnostic value: "High specificity means few false positives"
- Connect test findings to the patient presentation
- If PT doesn't mention tests, prompt them: "What clinical tests would strengthen your confidence in this classification?"
` : ''}

${currentStep.step_number === 3 ? `
### STAGE OPTIONS
${stages.map(s => `- ${s.condition_type}: ${s.condition_text}`).join('\n')}
` : ''}

${currentStep.step_number === 4 ? `
### RECOMMENDATIONS FOR ${conversationState.classificationSelected || 'Selected Classification'} + ${conversationState.stageSelected || 'Selected Stage'}
${recommendations.map(r => `- [Grade ${r.evidence_grade}] ${r.recommendation_text}`).join('\n')}

### AVAILABLE RESOURCES TO OFFER
When offering a video, include the marker [RESOURCE:id] so the UI can display it.
${resources.map(r => `- ID: ${r.id} | "${r.title}" (${r.resource_type})${r.video_url ? ' [Has Video]' : ''}`).join('\n')}

**IMPORTANT: Proactively offer these resources!** Don't wait for the PT to ask. As part of wrapping up the case, say something like:
"Would you like to see how Ryan demonstrates [technique]? [RESOURCE:resource-id-here]"
` : ''}

## GUIDED AUTONOMY DATA (Use this to validate/correct the PT's reasoning)
Expected Classification: ${patientCase.expected_classification}
Classification Reasoning: ${patientCase.classification_reasoning}
Expected Stage: ${patientCase.expected_stage}
Stage Reasoning: ${patientCase.stage_reasoning}
Key Clinical Findings to Notice: ${patientCase.key_clinical_findings?.join(', ') || 'None specified'}
Teaching Points to Weave In: ${patientCase.teaching_points?.join(' | ') || 'None specified'}
Common Mistakes to Watch For: ${patientCase.common_mistakes?.join(' | ') || 'None specified'}
Red Flags Present in This Case: ${patientCase.red_flags_present?.length ? patientCase.red_flags_present.join(', ') : 'None'}
${patientCase.red_flag_notes ? `Red Flag Notes: ${patientCase.red_flag_notes}` : ''}

## CONVERSATION STATE
Current Step: ${conversationState.currentStepNumber} of ${conversationState.totalSteps}
Completed Steps: ${conversationState.completedSteps.join(', ') || 'None yet'}
Red Flags Cleared: ${conversationState.redFlagsCleared}
Classification Selected: ${conversationState.classificationSelected || 'Not yet'}
Classification Correct: ${conversationState.classificationCorrect === null ? 'Not yet evaluated' : conversationState.classificationCorrect}
Stage Selected: ${conversationState.stageSelected || 'Not yet'}
Stage Correct: ${conversationState.stageCorrect === null ? 'Not yet evaluated' : conversationState.stageCorrect}

## CONVERSATION HISTORY
${conversationState.messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')}

## CURRENT USER MESSAGE
${userMessage}

## YOUR TASK
Respond as Sam. Guide the PT through Step ${currentStep.step_number} (${currentStep.pathway_name}). 
Use the Guided Autonomy data to validate or correct their reasoning.
Keep your response conversational and focused - one question or teaching point at a time.
If they've successfully completed this step, acknowledge it and transition to the next step.
${currentStep.step_number === 2 ? 'Remember to incorporate clinical tests into your teaching - ask about tests that support their classification choice.' : ''}
${currentStep.step_number === 4 ? 'Remember to PROACTIVELY offer technique demonstration videos using [RESOURCE:id] markers. Don\'t wait for the PT to ask!' : ''}
`;
}


// -----------------------------------------------------------------------------
// PART 4: INITIAL MESSAGE GENERATOR
// -----------------------------------------------------------------------------
// Generates Sam's opening message when a PT starts a new case
// -----------------------------------------------------------------------------

export function generateOpeningMessage(
  patientCase: PatientCase,
  firstStep: PathwayStep
): string {
  return `Let's work through ${patientCase.name}'s case together. ${
    patientCase.age ? `They're ${patientCase.age}, ` : ''
  }${patientCase.occupation ? `${patientCase.occupation.toLowerCase().startsWith('a') || patientCase.occupation.toLowerCase().startsWith('e') || patientCase.occupation.toLowerCase().startsWith('i') || patientCase.occupation.toLowerCase().startsWith('o') || patientCase.occupation.toLowerCase().startsWith('u') ? 'an' : 'a'} ${patientCase.occupation.toLowerCase()}` : ''} presenting with "${patientCase.chief_complaint}." ${
    patientCase.duration ? `Symptoms started ${patientCase.duration} ago` : ''
  }${patientCase.onset_type ? ` with ${patientCase.onset_type.toLowerCase()} onset` : ''}${
    patientCase.mechanism_of_injury ? `. ${patientCase.mechanism_of_injury}` : ' with no trauma'
  }.

${firstStep.decision_point}`;
}
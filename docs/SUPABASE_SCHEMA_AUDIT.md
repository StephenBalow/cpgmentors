# Supabase Schema Audit
## Sam Development Database
**Audit Date:** December 14, 2025  
**Project:** `awlvqbnzcpqntodzyoyc`

---

## Executive Summary

The Sam Development database contains **30 tables** organized into 5 functional layers:
1. **Original PTmentors Content** (video curriculum) - 8 tables
2. **CPG Tables** (clinical knowledge) - 11 tables
3. **Guided Autonomy Tables** (teaching structure) - 1 table (+ 1 to build)
4. **User Tables** (profiles, progress, conversations) - 5 tables
5. **Supporting Tables** (resources) - 3 tables

### Key Findings
- ✅ Core functionality is solid - Sam Practice mode works well
- ⚠️ Some data duplication between tables (see Discussion Points)
- 🔴 Several empty tables that may be cruft or future features
- 🔨 `training_topics` table needed for Training mode (not yet created)

---

## Table Inventory by Layer

### Layer 1: Original PTmentors Content (Video Curriculum)

| Table | Rows | Status | Purpose |
|-------|------|--------|---------|
| `units` | 13 | ✅ Active | Top-level curriculum (Cervical Spine, etc.) |
| `groups` | 64 | ✅ Active | Major sections within units |
| `subgroups` | 21 | ✅ Active | Subsections within groups |
| `episodes` | 277 | ✅ Active | Individual video lessons |
| `episode_resources` | 329 | ✅ Active | PDFs, links attached to episodes |
| `keyword_master` | 270 | ✅ Active | Clinical taxonomy for tagging |
| `keyword_synonyms` | 107 | ✅ Active | Synonym mappings for search |
| `clinicianConfidence` | 3 | ❓ Legacy | Survey data, camelCase naming (old?) |

**Notes:** This is the original PTmentors video content. Still valuable but separate from Sam's CPG functionality.

---

### Layer 2: CPG Tables (Clinical Practice Guidelines)

#### Core CPG Structure

| Table | Rows | Status | Purpose | Used By |
|-------|------|--------|---------|---------|
| `cpg_documents` | 1 | ✅ Active | Root table - CPG metadata | Everything |
| `cpg_decision_pathways` | 4 | ✅ Active | The 4 steps of clinical reasoning | `route.ts` |
| `cpg_pathway_outcomes` | 10 | ✅ Active | Possible answers at each step | `buildSamPrompt` |

**Current Data in `cpg_decision_pathways`:**
| Step | Pathway Name | Decision Point |
|------|--------------|----------------|
| 1 | Medical Screening | Is the patient appropriate for PT? |
| 2 | Neck Pain Classification | Which category best fits? |
| 3 | Condition Stage | Acute/Subacute/Chronic? |
| 4 | Treatment Recommendations | Which interventions? |

**Current Data in `cpg_pathway_outcomes`:**
- Step 1: 3 outcomes (Appropriate, Appropriate+Consult, Not Appropriate)
- Step 2: 4 outcomes (Mobility Deficits, WAD, Cervicogenic Headache, Radicular)
- Step 3: 3 outcomes (Acute, Subacute, Chronic)
- Step 4: No outcomes (recommendations handled separately)

#### CR-001 Reference Tables

| Table | Rows | Status | Purpose | Used By |
|-------|------|--------|---------|---------|
| `cpg_classifications` | 4 | ✅ Active | Classification reference for FK joins | `route.ts` (CR-001) |
| `cpg_stages` | 3 | ✅ Active | Stage reference for FK joins | `route.ts` (CR-001) |

**⚠️ DISCUSSION POINT:** These tables duplicate data in `cpg_pathway_outcomes`. See "Potential Redundancy" section below.

#### Clinical Content Tables

| Table | Rows | Status | Purpose | Used By |
|-------|------|--------|---------|---------|
| `cpg_red_flags` | 13 | ✅ Active | Serious pathology indicators | `route.ts` Step 1 |
| `cpg_tests` | 16 | ✅ Active | Clinical tests with sensitivity/specificity | `route.ts` Step 2 |
| `cpg_recommendations` | 25 | ✅ Active | Evidence-graded interventions | `route.ts` Step 4 |
| `cpg_content` | 31 | ⚠️ Partial | Prose sections (prognosis, clinical pearls) | Not currently used in `route.ts` |

**`cpg_content` breakdown by type:**
| Content Type | Count |
|--------------|-------|
| test_details | 6 |
| clinical_pearls | 4 |
| differential_dx | 3 |
| patient_education | 3 |
| prevalence | 3 |
| prognosis | 3 |
| recovery_trajectory | 3 |
| evidence_summary | 2 |
| red_flag_context | 2 |
| risk_factors | 2 |

**⚠️ NOTE:** None of the 31 `cpg_content` records have `pathway_step_id` linked, even though the schema supports it.

#### Empty/Future CPG Tables

| Table | Rows | Status | Purpose |
|-------|------|--------|---------|
| `cpg_images` | 0 | 🔴 Empty | Extracted diagrams/charts from CPG PDFs |
| `cpg_reconciliation` | 0 | 🔴 Empty | Multi-CPG comparison (future feature) |

---

### Layer 3: Guided Autonomy Tables (Teaching Structure)

| Table | Rows | Status | Purpose | Used By |
|-------|------|--------|---------|---------|
| `patient_cases` | 6 | ✅ Active | Practice cases with expected answers | `route.ts` |
| `training_topics` | ❌ | 🔨 To Build | Training mode topics | Needed for Training |

**`patient_cases` fields for Guided Autonomy:**
- `expected_classification` - What Sam validates against
- `classification_reasoning` - Why this is correct
- `expected_stage` - What Sam validates against
- `stage_reasoning` - Why this is correct
- `key_clinical_findings[]` - What PT should notice
- `teaching_points[]` - What Sam should emphasize
- `common_mistakes[]` - Pitfalls to watch for
- `red_flags_present[]` - For Step 1 validation

---

### Layer 4: User Tables

| Table | Rows | Status | Purpose |
|-------|------|--------|---------|
| `profiles` | 3 | ✅ Active | User info (name, experience level) |
| `user_conversations` | 3 | ✅ Active | Chat history (just cleaned up!) |
| `user_artifacts` | 0 | 🔴 Empty | Case summaries, test results |
| `user_training_progress` | 0 | 🔴 Empty | Training mode completion tracking |
| `user_case_progress` | 0 | 🔴 Empty | Practice case state tracking |

**Note:** The empty user tables are ready for use - they'll populate as users engage with Training and as you decide how to use artifacts.

---

### Layer 5: Supporting Tables (Resources)

| Table | Rows | Status | Purpose |
|-------|------|--------|---------|
| `external_resources` | 53 | ✅ Active | Videos, articles, Ryan's content |
| `cpg_recommendation_resources` | 0 | 🔴 Empty | Links recommendations → resources |
| `cpg_test_resources` | 0 | 🔴 Empty | Links tests → resources |

**⚠️ NOTE:** The link tables are empty. This means recommendations and tests don't have associated video demonstrations linked yet.

---

## Discussion Points

### 1. Potential Redundancy: Classifications & Stages

**The Issue:**
The same classification and stage data appears in TWO places:

| Concept | In `cpg_pathway_outcomes` | In Reference Tables |
|---------|--------------------------|---------------------|
| Mobility Deficits | Step 2 outcome (full description) | `cpg_classifications` (short name) |
| Cervicogenic Headache | Step 2 outcome (full description) | `cpg_classifications` (short name) |
| Radicular | Step 2 outcome (full description) | `cpg_classifications` (short name) |
| WAD | Step 2 outcome (full description) | `cpg_classifications` (short name) |
| Acute | Step 3 outcome (with irritability) | `cpg_stages` (with duration) |
| Subacute | Step 3 outcome (with irritability) | `cpg_stages` (with duration) |
| Chronic | Step 3 outcome (with irritability) | `cpg_stages` (with duration) |

**Why it exists:**
- `cpg_pathway_outcomes` drives the UI for Sam's pathway flow
- `cpg_classifications` and `cpg_stages` were added for CR-001 to enable FK joins to `cpg_recommendations`

**Options:**
1. **Keep both** - Accept duplication for separation of concerns (pathway display vs recommendation lookup)
2. **Consolidate** - Have `cpg_pathway_outcomes` reference the classification/stage tables instead of duplicating text
3. **Single source of truth** - Remove `cpg_pathway_outcomes` for steps 2 and 3, use reference tables directly

**Recommendation:** Discuss this before adding more CPGs - the duplication will multiply.

---

### 2. `cpg_content` Not Wired Up

**The Issue:**
- 31 records of rich clinical content exist (clinical pearls, prognosis, etc.)
- None are linked to pathway steps (`pathway_step_id` is NULL for all)
- `route.ts` and `buildSamPrompt` don't fetch or use this data

**Questions:**
- Should Sam use this content to enrich conversations?
- Should content be linked to specific steps?
- Is this content meant for Training mode instead of Practice?

---

### 3. Empty Link Tables

**The Issue:**
- `cpg_recommendation_resources` is empty (0 rows)
- `cpg_test_resources` is empty (0 rows)
- This means no recommendations or tests are linked to Ryan's video demonstrations

**Impact:**
- When Sam suggests a treatment, he can't say "Here's Ryan demonstrating this technique"
- The `[RESOURCE:id]` pattern in the system prompt works, but there's no data to support it

**Action:** Populate these link tables to connect recommendations to relevant videos.

---

### 4. System Prompt Hardcoding vs Database

From our earlier audit, the system prompt hardcodes:
- The "4-step" language (breaks if a CPG has 3 steps)
- Stage duration table (duplicates `cpg_stages.duration_criteria`)
- Irritability table (not in any table)
- Evidence hierarchy (Grade A, B, C definitions)
- Step-specific red flag categories (duplicates `cpg_red_flags`)

**Recommendation:** Refactor after database cleanup is complete.

---

## Recommended Next Steps

### Phase 1: Database Cleanup (Do First)
1. Decide on classification/stage redundancy approach
2. Link `cpg_content` to pathway steps (or decide its purpose)
3. Populate `cpg_recommendation_resources` with video links
4. Consider if empty tables should be removed or kept for future

### Phase 2: Training Mode
1. Create `training_topics` table
2. Wire up to new Training UI (Two-Views)

### Phase 3: System Prompt Refactoring
1. Extract hardcoded clinical content to database
2. Make step count dynamic
3. Implement prompt composition (Core + Mode + Dynamic)

---

## Appendix: Table Relationships

```
cpg_documents (1)
├── cpg_decision_pathways (4)
│   └── cpg_pathway_outcomes (10)
├── cpg_red_flags (13)
├── cpg_tests (16)
│   └── cpg_test_resources (0) → external_resources
├── cpg_recommendations (25)
│   ├── → cpg_classifications (FK)
│   ├── → cpg_stages (FK)
│   └── cpg_recommendation_resources (0) → external_resources
├── cpg_classifications (4)
├── cpg_stages (3)
├── cpg_content (31)
└── patient_cases (6)
    └── user_conversations (3)
        └── user_artifacts (0)

profiles (3)
├── user_conversations
├── user_training_progress (0)
├── user_case_progress (0)
└── user_artifacts

external_resources (53)
├── cpg_recommendation_resources
└── cpg_test_resources
```

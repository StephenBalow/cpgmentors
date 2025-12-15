# Sam V2 Migration Plan

> "Plan to throw one away; you will anyhow."  
> — Fred Brooks, *The Mythical Man-Month*

## Executive Summary

This document captures the architectural redesign of Sam's database and system prompt, moving from a "prompt-first" design to a "process-first" design. Rather than incrementally refactoring the existing system, we will build V2 from scratch with lessons learned, validate it with a second CPG, then port the codebase.

**Key Insight:** The current schema was designed to feed fragments into a system prompt. The new schema will model the clinical decision process itself, making the system prompt thin and the data rich.

---

## Part 1: The Problem

### Current Architecture Issues

1. **Data Duplication**
   - `cpg_pathway_outcomes` and `cpg_classifications` contain overlapping data
   - Same classification outcomes defined in multiple places
   - Arterial insufficiency appears as BOTH "red flag" AND "appropriate with consult"

2. **Intelligence in Code, Not Data**
   - 772-line `system-prompt.ts` contains hardcoded clinical logic
   - Adding a new CPG requires code changes, not just data entry
   - Ryan cannot maintain clinical content without developer involvement

3. **Prompt-First Design**
   - Tables exist as fragments to assemble into prompts
   - No coherent model of the clinical decision process
   - Steps are implicit, not explicit

4. **Scaling Problem**
   - Each new CPG would require significant code changes
   - No clear pattern for "what tables need data for a complete CPG"

---

## Part 2: The New Design

### Core Principle: Step-Outcome-Rule Pattern

Each clinical decision step should be self-contained:

```
STEP → OUTCOMES (ordered by evaluation priority)
  └── RULE (how to determine if outcome applies)
        └── SUPPORTING DATA (evidence needed to evaluate rule)
```

### The Four Steps of CPG-Guided Care

| Step | Question | Current Tables | New Design |
|------|----------|----------------|------------|
| 1 | Is PT appropriate? | `cpg_red_flags` + `cpg_pathway_outcomes` | `cpg_medical_screening` |
| 2 | What classification? | `cpg_classifications` + `cpg_pathway_outcomes` | `cpg_classifications` (enhanced) |
| 3 | What stage? | `cpg_stages` + `cpg_pathway_outcomes` | `cpg_stages` (enhanced) |
| 4 | What interventions? | `cpg_recommendations` | `cpg_recommendations` + `cpg_recommendation_evidence` |

### Table-by-Table Changes

#### DELETE: `cpg_pathway_outcomes`
**Reason:** This table tries to be a universal outcome store but creates ambiguity. Outcomes should live with the step they belong to.

#### RENAME: `cpg_decision_pathways` → `cpg_steps`
**Reason:** Clearer naming. These ARE the steps, not "pathways to decisions."

New structure:
```sql
CREATE TABLE cpg_steps (
  id UUID PRIMARY KEY,
  cpg_id UUID REFERENCES cpg_documents(id),
  step_number INTEGER NOT NULL,        -- 1, 2, 3, 4
  name TEXT NOT NULL,                   -- 'Medical Screening', 'Classification', etc.
  question TEXT NOT NULL,               -- 'Is physical therapy appropriate?'
  description TEXT,
  evaluation_logic TEXT,                -- How Sam evaluates this step
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### NEW: `cpg_medical_screening` (Step 1)
**Replaces:** `cpg_red_flags` + relevant `cpg_pathway_outcomes`

All conditions in ONE table with outcome codes:
```sql
CREATE TABLE cpg_medical_screening (
  id UUID PRIMARY KEY,
  cpg_id UUID REFERENCES cpg_documents(id),
  step_id UUID REFERENCES cpg_steps(id),
  condition_name TEXT NOT NULL,
  condition_category TEXT,              -- 'vascular', 'neurological', 'systemic'
  clinical_indicators TEXT[],           -- Signs/symptoms to look for
  outcome_code TEXT NOT NULL,           -- 'not_appropriate', 'appropriate_with_consult', 'appropriate'
  evaluation_order INTEGER NOT NULL,    -- 1=check first (red flags), 2=check second, 3=default
  referral_urgency TEXT,                -- 'immediate', 'urgent', 'routine'
  consult_type TEXT,                    -- 'physician', 'specialist', null
  source_reference TEXT,                -- Where in CPG this comes from
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key insight:** Arterial insufficiency goes in ONE place based on severity level. No more ambiguity.

#### ENHANCE: `cpg_classifications` (Step 2)
Add self-contained outcomes:
```sql
ALTER TABLE cpg_classifications ADD COLUMN outcome_code TEXT DEFAULT 'classified';
ALTER TABLE cpg_classifications ADD COLUMN evaluation_order INTEGER;
ALTER TABLE cpg_classifications ADD COLUMN step_id UUID REFERENCES cpg_steps(id);
```

#### ENHANCE: `cpg_stages` (Step 3)  
Add self-contained outcomes:
```sql
ALTER TABLE cpg_stages ADD COLUMN outcome_code TEXT DEFAULT 'staged';
ALTER TABLE cpg_stages ADD COLUMN evaluation_order INTEGER;
ALTER TABLE cpg_stages ADD COLUMN step_id UUID REFERENCES cpg_steps(id);
```

#### NEW: `cpg_recommendation_evidence` (Step 4)
**The "HOW specifically" layer**

```sql
CREATE TABLE cpg_recommendation_evidence (
  id UUID PRIMARY KEY,
  recommendation_id UUID REFERENCES cpg_recommendations(id),
  evidence_type TEXT NOT NULL,          -- 'dosage', 'technique', 'parameter', 'contraindication'
  content TEXT NOT NULL,                -- The specific detail
  source_citation TEXT,                 -- "Smith et al. 2015" or CPG page reference
  source_url TEXT,                      -- Link to original if available
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Why this matters:** CPG says "cervical mobilization, Grade B evidence." But:
- What specific techniques?
- What parameters (sets, reps, frequency)?
- What contraindications?

This table captures the specifics from CPG footnotes and referenced studies.

#### RENAME: `external_resources` → `training_resources`
No longer aspirational "external providers" — this IS Ryan's content.

---

## Part 3: System Prompt Evolution

### Current State: 772 Lines of Hardcoded Logic

The current `system-prompt.ts`:
- Hardcodes classification criteria
- Hardcodes red flag lists
- Hardcodes stage definitions
- Hardcodes recommendation mappings
- Contains clinical content that should be data

### Target State: ~100 Lines of Generic Logic + Dynamic Data

```typescript
// BEFORE: Hardcoded
const RED_FLAGS = [
  "Upper cervical ligamentous instability",
  "Cervical artery dysfunction", 
  // ... 20 more items
];

// AFTER: Data-driven
const medicalScreening = await supabase
  .from('cpg_medical_screening')
  .select('*')
  .eq('cpg_id', cpgId)
  .order('evaluation_order');
```

### What Stays in Code
- Conversation flow logic
- Response formatting
- Integration with OpenAI/Anthropic APIs
- UI interaction handling

### What Moves to Data
- All clinical criteria
- All classification definitions
- All stage descriptions
- All recommendation content
- All evidence references

---

## Part 4: Migration Phases

### Phase 1: New Supabase Project + Schema
**Estimated: 1 session**

*This phase includes hands-on Supabase training. See [TRAINING_STEVE.md](./TRAINING_STEVE.md) for curriculum details.*

- [ ] Create new Supabase project (pick region)
- [ ] **Learning checkpoint:** Understand Tables, data types, constraints, relationships
- [ ] Apply new schema DDL
- [ ] **Learning checkpoint:** Understand Migrations and how schema changes are tracked
- [ ] Configure Row Level Security policies
- [ ] **Learning checkpoint:** Understand RLS and who can read/write what
- [ ] Set up backup procedures
- [ ] **Learning checkpoint:** Understand Backups and recovery planning
- [ ] Verify tables are ready
- [ ] Update `SAM_V2_MIGRATION_PLAN.md` with project details

**Deliverable:** Empty V2 database with new schema

### Phase 1.5: Build Extraction Pipeline
**Estimated: 1 session**

#### The Approach: Structured Data Files + Loader Scripts

CPG extraction has two distinct parts:

1. **Interpretation (requires judgment):** Reading the CPG and deciding — What category? What outcome code? How to phrase it?
2. **Loading (mechanical):** Taking structured data and inserting it into Supabase.

We separate these concerns:

```
CPG Source (JOSPT HTML)
        ↓
   [Interpretation]  ← Claude + Steve discussion, produces...
        ↓
Structured Data Files (JSON in repo)
        ↓
   [Loader Scripts]  ← TypeScript, instrumented, auditable
        ↓
    Supabase V2
        ↓
   [Audit Output]   ← Logs, counts, validation report
```

#### Why This Works

**The data files become the "source of truth":**
- Version controlled in the repo
- Ryan can review/edit clinical content without touching code
- Diffable — when we update a CPG, we see exactly what changed
- Portable — not locked into Supabase

**The loader scripts are deterministic:**
- Same input → same output, always
- Instrumented with timing, counts, validation
- Can be re-run safely (idempotent with upserts)
- Produce audit reports

#### Directory Structure

```
/data/cpg/neck-pain-2017/
├── cpg-document.json              # Metadata
├── steps.json                     # The 4 steps
├── medical-screening.json         # Step 1 conditions
├── classifications.json           # Step 2
├── tests.json                     # Step 2 supporting
├── stages.json                    # Step 3
├── recommendations.json           # Step 4
├── recommendation-evidence.json   # Step 4 details
└── extraction-notes.md            # Our decisions/rationale

/scripts/
├── load-cpg.ts                   # Main loader
├── validate-cpg.ts               # Check completeness
└── audit-report.ts               # Generate summary
```

#### Sample Loader Output

```
=== CPG Load Report: neck-pain-2017 ===
Started: 2024-12-15 10:23:45
Ended:   2024-12-15 10:24:12
Duration: 27 seconds

Tables loaded:
  cpg_documents:              1 record
  cpg_steps:                  4 records
  cpg_medical_screening:     23 records
  cpg_classifications:        4 records
  cpg_classification_tests:  12 records
  cpg_stages:                 3 records
  cpg_recommendations:       67 records
  cpg_recommendation_evidence: 142 records

Validation:
  ✓ All steps have at least one outcome
  ✓ All recommendations linked to classifications
  ✓ No orphaned records
  ✓ Schema constraints satisfied

Total: 256 records loaded in 27s
```

#### How We Work Together

1. **Session work:** We read the CPG together, discuss categorization decisions, Claude drafts the JSON files
2. **Steve reviews:** Check the data files, suggest corrections
3. **Claude writes loaders:** TypeScript scripts with full instrumentation
4. **Run & validate:** Execute, review audit output, iterate if needed

The interpretation still benefits from our collaboration, but everything is captured in reviewable, version-controlled artifacts.

#### Checklist

- [ ] Create `/data/cpg/` directory structure
- [ ] Define JSON schemas for each table type
- [ ] Write `load-cpg.ts` loader script
- [ ] Write `validate-cpg.ts` validation script
- [ ] Test with minimal sample data
- [ ] Document the extraction workflow

**Deliverable:** Working extraction pipeline, tested with sample data

### Phase 2: Extract Neck Pain CPG (Timed)
**Estimated: 1-2 sessions**

*Using the pipeline built in Phase 1.5:*

- [ ] Start timer
- [ ] Read CPG together, discuss categorization decisions
- [ ] Create `/data/cpg/neck-pain-2017/` data files
- [ ] Review and validate JSON content
- [ ] Run loader scripts
- [ ] Review audit output
- [ ] Stop timer, document duration
- [ ] Validate against current V1 database

**Deliverable:** Neck Pain CPG fully loaded, extraction time documented

### Phase 3: Extract Second CPG (Validation)
**Estimated: 1-2 sessions**

- [ ] Select CPG (Low Back Pain 2021 recommended)
- [ ] Same extraction process
- [ ] Document any schema adjustments needed
- [ ] This proves the design generalizes

**Deliverable:** Two CPGs loaded, schema validated

### Phase 4: New VSCode Project + Port Backend
**Estimated: 2-3 sessions**

- [ ] `create-next-app` with same stack (Next.js, TypeScript, Tailwind)
- [ ] Port `buildSamPrompt` to use new schema
- [ ] Port API routes (`/api/sam/chat`, etc.)
- [ ] Test with new database
- [ ] Verify same clinical reasoning as V1

**Deliverable:** Backend working with V2 schema

### Phase 5: Port Frontend
**Estimated: 2-3 sessions**

- [ ] Port component hierarchy
- [ ] Port Practice mode UI
- [ ] Port artifact views
- [ ] Verify all existing features work

**Deliverable:** Full application working with V2

### Phase 6: Training Mode (New Feature)
**Estimated: 2-3 sessions**

- [ ] Create `training_topics` table
- [ ] Wire Two-Views UI to training content
- [ ] Build topic navigation
- [ ] Connect to `training_resources` (Ryan's videos)

**Deliverable:** Training mode functional

---

## Part 5: Success Criteria

### Schema Success
- [ ] No data duplication between tables
- [ ] Each step has self-contained reference data
- [ ] Adding a new CPG requires ONLY data entry, no code changes
- [ ] Ryan can review/edit clinical content in Supabase UI

### System Prompt Success
- [ ] Under 150 lines of code
- [ ] All clinical content loaded from database
- [ ] Same clinical reasoning quality as V1

### Extraction Success
- [ ] Neck Pain extraction < 2 hours (excluding debugging)
- [ ] Second CPG extraction validates pattern
- [ ] Clear, repeatable process documented

### Application Success
- [ ] All V1 features working in V2
- [ ] Training mode functional
- [ ] Performance equal or better

---

## Part 6: Open Questions

1. **Which second CPG?**
   - Low Back Pain 2021 (most similar structure)
   - Knee Pain (different body region)
   - Shoulder (complex, good stress test)

2. **PTmentors content tables?**
   - Port as-is for now?
   - Or redesign to match new patterns?

3. **User data migration?**
   - Existing conversations?
   - User profiles?
   - Progress tracking?

4. **Deployment strategy?**
   - Run V1 and V2 in parallel?
   - Hard cutover?
   - Beta period with select users?

---

## Appendix A: Table Inventory (V2 Target)

### CPG Layer
| Table | Purpose | Step |
|-------|---------|------|
| `cpg_documents` | CPG metadata | - |
| `cpg_steps` | The 4 decision steps | - |
| `cpg_medical_screening` | Red flags + consult conditions | 1 |
| `cpg_classifications` | Patient classifications | 2 |
| `cpg_classification_tests` | Tests that inform classification | 2 |
| `cpg_stages` | Acuity stages | 3 |
| `cpg_recommendations` | What to do (conceptual) | 4 |
| `cpg_recommendation_evidence` | How specifically (details) | 4 |
| `cpg_content` | Supplementary CPG content | - |

### Training Layer
| Table | Purpose |
|-------|---------|
| `training_topics` | Topic structure for Training mode |
| `training_resources` | Ryan's video content |
| `cpg_recommendation_resources` | Links recommendations → videos |

### User Layer
| Table | Purpose |
|-------|---------|
| `profiles` | User accounts |
| `user_cpg_progress` | Learning progress |
| `conversations` | Chat history |
| `conversation_messages` | Individual messages |

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2024-12-15 | Steve + Claude | Initial draft |
| 2024-12-15 | Steve + Claude | Added Phase 1.5: Build Extraction Pipeline |
| 2024-12-15 | Steve + Claude | Added learning checkpoints to Phase 1, linked to TRAINING_STEVE.md |


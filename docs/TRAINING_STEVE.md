# Training Steve

## The Impossible Journey: An Incredible Voyage Through Every Technology in Sam

> *Inspired by Thor Pedersen, who visited every country in the world without flying.*  
> *Steve will visit every technology in Sam without panicking.*

---

## Purpose of This Document

This document serves two purposes:

1. **Curriculum:** Track Steve's learning journey through the technologies that power Sam
2. **Meta-Learning:** Observe *how* Claude teaches, so we can design Sam's Training mode based on what actually works

Every teaching moment is an opportunity to ask: "How should Sam teach this to a physical therapist?"

---

## The Journey Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        THE TECHNOLOGY STACK                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │  SUPABASE   │    │    NEXT.js  │    │    REACT    │        │
│   │  Database   │───▶│   Backend   │───▶│  Frontend   │        │
│   │  Auth, RLS  │    │   API Routes│    │  Components │        │
│   └─────────────┘    └─────────────┘    └─────────────┘        │
│         │                   │                  │                 │
│         ▼                   ▼                  ▼                 │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │ TYPESCRIPT  │    │  TAILWIND   │    │   VERCEL    │        │
│   │   Types &   │    │    CSS      │    │  Deployment │        │
│   │   Safety    │    │   Styling   │    │   Hosting   │        │
│   └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Learning Sequence (Revised)

| Order | Technology | Why This Order |
|-------|------------|----------------|
| 1 | **Supabase** | Foundation — we're building V2 database first |
| 2 | **TypeScript** | Safety net — understand types as we port code |
| 3 | **Next.js** | Framework — API routes, server components |
| 4 | **React** | UI — components, state, hooks |
| 5 | **Tailwind** | Styling — already used, deepen understanding |
| 6 | **Vercel** | Deployment — when we're ready to ship V2 |

---

## Module 1: Supabase

### Why Supabase First?

Phase 1 of the V2 Migration is "Create new Supabase project + schema." Steve needs to understand what we're building and why, not just watch Claude do it.

**Learning Objective:** Steve can independently create tables, write policies, run migrations, and restore from backups.

### Curriculum

#### Tier 1: Essential (Must Know for V2)

| Topic | Status | Learning Objective |
|-------|--------|-------------------|
| **Tables** | ⬜ Not started | Understand data types, constraints, foreign keys, relationships |
| **Row Level Security (RLS)** | ⬜ Not started | Configure who can read/write what data |
| **Migrations** | ⬜ Not started | Track and deploy schema changes safely |
| **Backups** | ⬜ Not started | Create recovery plan, understand PITR |

#### Tier 2: Important (Improves V2)

| Topic | Status | Learning Objective |
|-------|--------|-------------------|
| **Functions** | ⬜ Not started | Write PostgreSQL functions for complex logic |
| **Triggers** | ⬜ Not started | Auto-update timestamps, audit logs |
| **Indexes** | ⬜ Not started | Optimize query performance |
| **Roles** | ⬜ Not started | Understand service role vs anon vs authenticated |

#### Tier 3: Advanced (Future Scale)

| Topic | Status | Learning Objective |
|-------|--------|-------------------|
| **Extensions** | ⬜ Not started | Enable pgvector, pg_trgm, etc. |
| **Webhooks** | ⬜ Not started | Real-time integrations |
| **Replication** | ⬜ Not started | Multi-region deployment |
| **Schema Visualizer** | ⬜ Not started | Use Supabase's visual tools |

### Teaching Approach

For each topic, Claude will:

1. **Start with Steve's actual data** — Use Sam's tables, not generic examples
2. **Explain the "why" first** — What problem does this solve?
3. **Show, then do together** — Claude demonstrates, then Steve tries
4. **Connect to Sam's Training mode** — "How should Sam teach this concept to PTs?"

---

## Module 2: TypeScript

*To be developed after Module 1*

### Planned Topics
- Type basics (string, number, boolean, arrays)
- Interfaces and type definitions
- Generics (the scary-sounding simple thing)
- Type inference (let TypeScript do the work)
- Union types and discriminated unions
- Reading Sam's existing type definitions

---

## Module 3: Next.js

*To be developed after Module 2*

### Planned Topics
- App Router vs Pages Router (we use App Router)
- Server Components vs Client Components
- API Routes (`/api/sam/chat/route.ts`)
- Server Actions
- Middleware
- Environment variables

---

## Module 4: React

*To be developed after Module 3*

### Planned Topics
- Components and props
- State with useState
- Effects with useEffect
- Custom hooks
- Context for shared state
- Component composition patterns

---

## Module 5: Tailwind CSS

*To be developed after Module 4*

### Planned Topics
- Utility-first philosophy
- Responsive design (sm:, md:, lg:)
- Dark mode
- Custom configuration
- Component patterns

---

## Module 6: Vercel Deployment

*To be developed after Module 5*

### Planned Topics
- Git-based deployments
- Environment variables
- Preview deployments
- Production deployment
- Monitoring and logs

---

## Meta-Learning Log

*This section captures observations about teaching and learning that will inform Sam's Training mode design.*

### Template for Each Learning Session

```markdown
### Session: [Topic] — [Date]

**What Steve needed to know:**
[Learning objective]

**How Claude explained it:**
[Teaching approach used]

**What clicked:**
[Concepts that landed well]

**What was confusing:**
[Areas that needed more explanation]

**Design insight for Sam:**
[How this informs Training mode]
```

### Observations

*To be populated as we learn together...*

---

## Progress Dashboard

| Module | Topics | Completed | Progress |
|--------|--------|-----------|----------|
| Supabase | 12 | 0 | ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ |
| TypeScript | 6 | 0 | ⬜⬜⬜⬜⬜⬜ |
| Next.js | 6 | 0 | ⬜⬜⬜⬜⬜⬜ |
| React | 6 | 0 | ⬜⬜⬜⬜⬜⬜ |
| Tailwind | 5 | 0 | ⬜⬜⬜⬜⬜ |
| Vercel | 5 | 0 | ⬜⬜⬜⬜⬜ |

**Total Journey:** 40 topics across 6 modules

---

## Document History

| Date | Changes |
|------|---------|
| 2024-12-15 | Initial document created |
| 2024-12-15 | Supabase curriculum detailed, other modules outlined |

---

> *"The journey of a thousand miles begins with a single `CREATE TABLE`."*  
> — Ancient PostgreSQL Proverb (probably)

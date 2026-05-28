# Video Screening SDK — Project Context & Beginner Build Plan

> **Purpose of this file:** Paste this at the start of any future Claude session to give full end-to-end context. It captures (a) what's being built, (b) the architectural decisions already made, (c) my (the user's) experience level, and (d) the realistic learning + build plan for me to follow.
>
> **Companion docs:** This file references two longer documents that may also be shared in the session — the *Beginner Walkthrough* (conceptual reference, ~20 sections covering SDK vs app, VideoSDK, the four zones, the three portals, the script engine, lifecycle, etc.) and the *MVP Plan* (8-phase build plan for a 7-8 person team). This `plan.md` is the *bridge* between those documents and my actual situation as a solo beginner.

---

## 1. What's being built

A **multi-tenant video screening platform** — but distributed as an **embeddable Android SDK** that other companies plug into their own apps. The SDK lets an end-user (a candidate) join a structured video interview with a human screening agent on the vendor side, who walks them through a configurable script and records an outcome.

**First (and only v1) client: Pronto** — an Indian on-demand home-services platform (cooks, cleaners, nannies, drivers, elderly-care attendants). Before a gig worker is activated on Pronto's platform, a Pronto-employed screener runs a video interview using this product. After the call, a Pronto case manager reviews the recording and answers, and pushes an accept / reject / next-round decision.

The product is **not** "a video calling app." Video is plumbing. The actual product is the **structured workflow on top of video**: the script engine, the session state machine, the multi-tenant configuration, and the case-management workflow.

## 2. The system, at a glance

Four zones:

1. **Customer zone** — Pronto's worker app, with our SDK embedded, which itself wraps VideoSDK.live's Android SDK
2. **Portal zone** — three separate web apps (Agent Portal, Admin Portal, Ops Portal), all per-tenant, all consumed by the *client's* people (not by the vendor's team)
3. **Platform zone** — cross-cutting: bought auth (PropelAuth/Frontegg shortlisted), observability, notifications, secrets, audit logs
4. **Backend zone** — Node/TypeScript, NestJS, PostgreSQL in AWS Mumbai (`ap-south-1`); houses orchestration, session state machine, script engine, queue, VideoSDK token minting, webhook handlers, results delivery

The three portals exist because the *users* are different inside each client tenant: agents run calls (Agent Portal), HR/ops admins configure (Admin Portal), case managers decide outcomes (Ops Portal). Keeping them as separate apps limits blast radius if any one is compromised.

## 3. Key architectural decisions already locked

- **Thin SDK, thick backend** — business logic lives server-side so we can iterate without re-shipping to clients
- **Multi-tenant from day one** even though Pronto is the only tenant at launch — adding multi-tenancy later is a rewrite
- **VideoSDK.live behind our own abstraction layer** so we're not locked in (could swap to LiveKit later)
- **Auth is bought, not built** — PropelAuth or Frontegg shortlisted; the shootout happens in Phase 0
- **Android-only SDK at v1** — Pronto's workers are on ₹6-10k Androids; iOS and Web SDKs are deferred to v1.1
- **Static scripts only at v1** — no branching logic; design the data model so branching can be added later
- **Recording mandatory** — case-manager review depends on it
- **Hybrid scoring** — computed score *recommends*, agent records final outcome
- **5 languages at launch** — Hindi + Tamil + Telugu + Kannada + Marathi, with **voice prompts** (TTS), not just text
- **Audio-only fallback is in v1**, not v1.1 — without it, weak-network screenings won't complete
- **Webhook delivery of results** to Pronto's onboarding backend is in v1, HMAC-signed
- **Single region** (`ap-south-1`) — DPDP residency expectations + Bharat audience

## 4. Bharat constraints (shape almost every decision)

- **End users are gig workers**, not metro banking customers — closer to first-time UPI users than to Zomato customers
- **Low text literacy** — voice-first UI, icons over text, one action per screen, large tap targets
- **Cheap Android** — 2–3 GB RAM, older OS — SDK must be ≤3 MB, CPU-light
- **2G/3G common in peri-urban areas** — bandwidth-adaptive video, audio-only fallback, resumable sessions
- **Language picker comes *first*, before consent** — everything after is in that language including spoken prompts
- **Noisy environments** — aggressive noise suppression, clear mute/unmute cues
- **Workers nervous on camera** — friendly tone, a "test call" dry-run before the real screening

## 5. My situation (the user)

**Experience level:** beginner. Several CRUD projects under my belt. No production apps shipped. No mobile experience. No real-time media experience. No multi-tenant SaaS experience.

**What this means:** the official plan in the MVP Plan doc — built for a 7–8 person team with senior engineers, designer, DevOps, QA, security reviewer, over 9–12 months — is **not** what I can execute alone. Trying to build the full spec solo is the fastest way to burn out and quit at month four with nothing to show.

So I'm working a different plan: a **learning plan** that climbs the ladder to where I could meaningfully contribute to (or eventually lead) the real build.

## 6. The reframed goal: three ladders

**Ladder 1 — Toy end-to-end (3–4 months).** One agent, one candidate, one hardcoded script, one room, one recording, one webhook. No multi-tenancy. No portals. No auth vendor. English only. The walkthrough doc itself recommends this as step one.

**Ladder 2 — Learning MVP (6–9 more months).** Proper session state machine, a real (static) script engine, a basic Agent Portal, an Android *app* (not SDK yet — app first, then SDK), recording + result delivery, basic auth.

**Ladder 3 — Toward production.** This is where I either get help (mentor, senior contractor for hard slices) or accept this is a learning project. Multi-tenancy with real isolation, SDK packaging, observability, security review, Bharat-network hardening, the Ops Portal — these are where solo beginners stall.

## 7. The skills gap I need to close

In rough order of learning:

1. **TypeScript at production depth** — not just "TS instead of JS"
2. **Async / event-driven patterns** — webhooks, queues, idempotency, retries
3. **State machines** — likely brand new from CRUD background
4. **PostgreSQL beyond CRUD** — transactions, indexes, JSONB, row-level scoping
5. **WebRTC concepts + VideoSDK** — a new mental model
6. **Kotlin + Android** — entire new platform, longest single pole
7. **Multi-tenancy as a security pattern** — discipline, not a feature
8. **Cloud basics** — AWS, IaC, observability

Eight new domains. Learn in order above, not in parallel.

## 8. The 9-month learning sequence

**Weeks 1–3 — Strengthen what I have.**
- TypeScript deeply (Matt Pocock's free "Total TypeScript" essentials)
- Promise patterns, error handling, AbortController
- Graduate from raw Express to NestJS (official docs)
- Outcome: a NestJS API with proper modules, DI, and validation

**Weeks 4–7 — New backend muscles.**
- Postgres beyond CRUD: transactions, indexes ("Use The Index, Luke!" — free book)
- Prisma for type-safe queries
- State machines via XState (xstate.js.org — start with the visualizer)
- Event-driven patterns: webhooks, queues (BullMQ on Redis), idempotency keys
- Side project: a multi-step checkout flow modeled as a state machine, persisted to Postgres, with webhook-style async event handlers and idempotency keys. This single project teaches ~60% of what makes the screening backend hard.

**Weeks 8–10 — The VideoSDK toy.**
- Sign up for VideoSDK free tier
- Follow JS quickstart — get a browser-to-browser call going in one afternoon
- Move room creation and token minting to a tiny Node backend (security lesson: master key never on the device)
- Doc reading order: concept → JS quickstart → REST + tokens → recording → webhooks. Skip everything else (React Native, iOS, Flutter, AI Voice Agents, SIP, etc.).

**Weeks 11–22 — Kotlin and Android (the long pole).**
- Kotlin Koans (free, official, in-browser) for first 3–4 weeks
- Google's free "Android Basics with Compose"
- Two throwaway apps: notes app + camera app (learn lifecycle, permissions, CameraX)
- Then integrate VideoSDK Android quickstart — phone joins the same room as the browser from week 10
- Philipp Lackner's YouTube channel for modern Android patterns

**Weeks 23–28 — Agent Portal MVP.**
- Next.js with App Router (official tutorial)
- Single-page agent UI: video pane via VideoSDK's Prebuilt JS on the left (don't build a custom video UI yet), script pane on the right
- Hardcoded JSON script from backend, capture answers, persist
- End call with hardcoded outcome

**Weeks 29–36 — Wire the workflow.**
- Session state machine on backend: INITIATED → IN_QUEUE → IN_CALL → SCREENED → DELIVERED
- Webhook handler for recording-ready — **must be idempotent**, build correctly the first time
- Result delivery to a "fake client" webhook with HMAC signing
- Audit log writes for every state transition

**End state at ~9 months:** single-tenant, English-only, no SDK packaging yet, no audio fallback, single-agent system that completes one end-to-end screening. Genuinely impressive for a solo beginner.

## 9. Resources by topic

| Topic | Resource |
|---|---|
| TypeScript | Matt Pocock's "Total TypeScript" essentials (free) |
| NestJS | Official docs (genuinely good) + any 2024+ YouTube course |
| State machines | XState docs + stately.ai visualizer |
| Postgres | "Use The Index, Luke!" (free) + Prisma docs |
| WebRTC concepts | "WebRTC for the Curious" (free book) |
| VideoSDK | Their docs in the order specified in §18 of the walkthrough |
| Kotlin | Kotlin Koans (free, official) |
| Android | "Android Basics with Compose" (free, Google) + Philipp Lackner on YouTube |
| React/Next.js | react.dev (new official docs) + Next.js official tutorial |
| Multi-tenancy | AWS whitepaper "SaaS Tenant Isolation Strategies" (free PDF) |
| Auth | Don't build it. Integrate Clerk into a side project once. |
| AWS basics | A Cloud Guru free tier or freeCodeCamp's AWS YouTube course |

## 10. The single most important rule

**Build end-to-end before making anything good.**

The common beginner failure: six months perfecting the backend before ever joining a video call. Build the toy end-to-end *first*, then iterate.

**What to do this week:**
1. Sign up for VideoSDK
2. Follow their JS quickstart — browser-to-browser call working in one afternoon
3. Move token minting to a 50-line Node backend (one day)
4. Open two browsers and talk to yourself

If that takes 3–5 days, on track. If it takes 3 weeks, slow down and strengthen TypeScript/Node basics before touching Kotlin or multi-tenancy.

## 11. The "smallest happy path" — what to satisfy first

The requirements doc has 100+ items. Trying to satisfy them all simultaneously is how solo projects die.

Smallest viable end-to-end:
- One agent (me, in a browser)
- One candidate (me again, on my phone)
- One hardcoded JSON script
- English only
- One recording
- One webhook out to a logging endpoint

Get **that** working before adding anything else. Then layer features one at a time, each fully working before the next, roughly in this order: multi-tenancy → recording playback → a second language → audio fallback → an admin portal → RBAC. Skip the Ops Portal until last — it's the largest single chunk of UI work in the entire spec.

## 12. What I should accept I can't do alone

For a learning MVP: skip all of these. For a real production build: plan to get help on each.

- Production-grade multi-tenant isolation (needs senior review + pen test)
- DPDP compliance walkthrough (needs legal review)
- Real on-call rotation, SLAs, incident response (needs DevOps maturity)
- ProGuard tuning, SDK size optimization, `.aar` packaging (needs an experienced Android dev)
- Low-literacy worker UX design in 5 languages (needs a designer who's done Bharat products)
- Real Bharat-network testing across cities, devices, SIMs (needs hardware and travel)

These are real walls. Pretending they aren't is how solo projects fail privately.

## 13. Realistic timeline

| Months | Outcome |
|---|---|
| 1–3 | Foundations strengthened + VideoSDK web PoC working |
| 4–7 | Kotlin + Android demo + cross-platform call between Android and browser |
| 8–11 | Screening workflow — state machine, script engine, agent UI, recording |
| 12–15 | Polish + add one additional feature (multi-language OR audio fallback, not both) |
| 15+ | I'm now someone who could credibly be the 2nd or 3rd engineer on the real production build under a senior lead |

That's the realistic outcome of a year-plus of focused solo learning on a project this ambitious. A lot — but real.

## 14. How to use this file in a new Claude session

Paste this whole file at the start of the conversation. Then tell Claude:
- Where I am in the timeline (e.g., "I'm on week 6, learning state machines")
- What I'm stuck on or want to do next
- Any code or design questions tied to a specific phase

Claude can then give advice that fits my actual level and the project's actual shape, instead of generic answers that assume a senior team.

---

*Two companion docs to share alongside this when relevant:*
- *Beginner Walkthrough* — the 20-section conceptual reference (SDK vs app, VideoSDK, four zones, three portals, script engine, lifecycle, glossary, etc.)
- *MVP Plan* — the 8-phase production build plan for a 7-8 person team (useful as the destination, not the immediate path)

// Run this once to load all ID knowledge into Supabase
// Usage: node scripts/embed-knowledge.js

const chunks = [
  {
    source: "CRAFT Framework",
    content: `CRAFT is a 5-phase, 8-step agile ID process used for all course development.

Phase 1 — CONSULT
  Step 1: Kick-off meeting between the ID team and the customer
  Step 2: Content outline — produce Learning Map and/or Script
  Input required: Training Gain, Impact, and Success Factors Document

Phase 2 — REFINE
  Step 3: Visual mockups and prototype (Adobe XD or equivalent)
  Step 4: Storyboard and design pack reviews

Phase 3 — AGGREGATE
  Step 5: Alpha development and reviews (first working build)

Phase 4 — FORM
  Step 6: Beta review with professional audio
  Step 7: Final review and sign-off

Phase 5 — TEST
  Step 8: Feedback from users, SMEs, and business stakeholders
           + Analytics to determine training effectiveness and impact`
  },
  {
    source: "CRAFT Rules",
    content: `RULE 1 — Always start with the "why"
Before designing any course, understand:
  - What behaviour needs to change? (Training Gain)
  - What is the business impact if this behaviour does not change? (Impact)
  - How will success be measured? (Success Factors)
Never design a course that is topic-driven only. Always anchor to a performance gap.

RULE 2 — Content outline before visuals
The Learning Map must be defined before any visual design decisions.

RULE 3 — Iterative review mindset
Courses go through Alpha (raw build) → Beta (refined) → Final.
Generate a "first draft" that is explicitly designed to be reviewed and improved.

RULE 4 — SME and user feedback closes the loop
Success is measured by: Did learner behaviour change? Did the business metric improve?
What do SMEs say about accuracy? What do users say about experience?

RULE 5 — Consultative, not prescriptive
The ID process is consultative, iterative, and agile.
Ask clarifying questions rather than make assumptions about audience, context, or outcomes.`
  },
  {
    source: "VSB Template Library — Interaction Levels",
    content: `Interaction Level Rules:
- L1 = Basic click-and-learn only. No scenarios, no complex interactions.
- L2 = Must include minimum 1-3 interactions from EACH of: Click and Learn, Scenario+Question, Conversational, and unique interactions.
- L3 = Same as L2 but with higher complexity and more interactions.
- RULE: Any course targeting behaviour change must be L2 or L3. L1 is for reference/compliance only.

RULE 6 — Every course needs at least one rich interaction
A course with only text+image screens is L1 quality — not acceptable for behaviour change learning.
Every course must include at minimum:
  - A scenario with a question (h04)
  - A conversation (h05/h06)
  - A drag and drop knowledge check
  - A video interaction
In InstruX: every generated course must include at least one scenario block and one quiz block.`
  },
  {
    source: "VSB Template Library — Template Types",
    content: `Template Taxonomy for e-learning course design:

CONTENT SCREENS: text-image, landing, overview, objectives, infographic
KNOWLEDGE CHECKS: single-answer MCQ, multiple-answer MCQ, True/False, Yes/No
SCENARIOS: scenario with narrative, scenario+question, scenario+text-input, video+analysis
CONVERSATIONS: character intro, dialogue flow, conversation+question
CLICK AND LEARN: buttons, tabs, accordion, images, carousel, hotspot, flip cards, slider, scrollable
DRAG AND DROP: one-to-one, many-to-one, many-to-two, many-to-three
VIDEO INTERACTIONS: animated intro, branching video, show+try+test simulation, comparative analysis

RULE 7 — Show objectives early
Learners must see what they will be able to DO before content delivery begins.

RULE 8 — Match interaction type to content type
  Procedural content → Show+Try+Test or back-next
  Scenario/decision content → scenario+question or conversational
  Concept content → tabs, accordion, or carousel
  Verification → drag and drop or true/false`
  },
  {
    source: "Kirkpatrick Model — 4 Levels of Evaluation",
    content: `The 4-Level Success Framework (Kirkpatrick Model):

Level 1 — Learner Reaction: Did learners find it satisfying, engaging, and relevant?
  Measured by: Post-course survey / smiley sheet

Level 2 — Learning: Did learners gain knowledge, skills, attitude, confidence, or commitment?
  Measured by: Knowledge check scores, pre/post assessments

Level 3 — Behaviour Change: Are learners applying the learning on the job?
  Measured by: Manager observation, performance reviews, case resolution speed

Level 4 — Organisational Performance: Did training impact team/department/org goals?
  Measured by: Revenue, customer satisfaction, efficiency metrics

RULE 13 — Always establish success criteria before designing
  L1 = awareness/inform only (no behaviour change expected)
  L2 = knowledge retention required (must include assessments)
  L3 = behaviour change required (must include scenarios, practice, application)
  L4 = business impact required (must tie to a measurable org metric)
The course design changes significantly based on which Kirkpatrick level is targeted.`
  },
  {
    source: "Bloom's Taxonomy — Learning Objectives",
    content: `The 6 Levels of Bloom's Taxonomy:

LEVEL 1 — REMEMBER: define, list, name, recall, recognise, identify
  Use for: awareness, compliance overviews, product knowledge

LEVEL 2 — UNDERSTAND: explain, describe, summarise, classify, compare, interpret
  Use for: concept training, policy understanding, induction

LEVEL 3 — APPLY: apply, use, demonstrate, execute, solve, implement, perform
  Use for: skill-based training, process training, tool usage

LEVEL 4 — ANALYSE: analyse, differentiate, examine, compare, contrast, investigate
  Use for: critical thinking, problem solving, diagnostic skills

LEVEL 5 — EVALUATE: evaluate, judge, justify, recommend, critique, prioritise
  Use for: leadership, decision-making, quality assurance

LEVEL 6 — CREATE: design, build, construct, develop, formulate, plan, produce
  Use for: advanced skill, strategy training, creative roles

RULE 21 — Every learning objective must use a measurable action verb
  BAD: "Understand the importance of customer service" (not measurable)
  GOOD: "Apply the 3-step de-escalation process when handling an angry customer"

RULE 22 — Match verb level to course purpose
  Awareness (L1) → Level 1-2 verbs | Skill-building (L2) → Level 3 | Behaviour change (L3) → Level 3-4 | Leadership → Level 5-6

RULE 23 — Each course should have 2-4 objectives maximum. More than 4 = split into 2 courses.`
  },
  {
    source: "MCQ and Assessment Writing Rules",
    content: `Rules for writing good MCQ questions:

RULE 24 — Test application, not memorisation
  BAD: "What does SMART stand for?" (pure recall)
  GOOD: "A manager sets this goal: 'Improve team performance.' What is wrong with it?"

RULE 25 — Write plausible distractors, not obvious wrong answers
  Distractors must represent common misconceptions or real mistakes people make.

RULE 26 — Avoid common MCQ mistakes
  - Never use "All of the above" or "None of the above"
  - Never make the correct answer always the longest option
  - Never use double negatives
  - Never use trick questions — goal is to check learning, not catch people out

RULE 27 — One clearly correct answer only. If two options are defensible, the question is badly written.

RULE 28 — Feedback must explain WHY, not just say correct/incorrect
  BAD: "Correct! Well done."
  GOOD: "Correct. The first step is always to acknowledge the customer's frustration before offering a solution — skipping this makes customers feel dismissed even when you fix the problem."`
  },
  {
    source: "Scenario Writing Guidelines",
    content: `Rules for writing effective learning scenarios:

RULE 29 — Scenarios must be grounded in a real, specific workplace moment
  BAD: "Imagine you are a manager and an employee comes to you with a problem."
  GOOD: "It's 9am Monday. Jake walks into your office looking tense. He says 'I've had an offer from another company.' You have a team meeting in 20 minutes."

RULE 30 — Every scenario needs a decision point with real consequences
  Every scenario must have: setup + trigger + decision point (2-3 choices) + consequences

RULE 31 — Wrong choices must fail for the right reason
  BAD: "That was incorrect."
  GOOD: "You jump straight to problem-solving. Three weeks later, he accepted the offer."

RULE 32 — Use realistic names, roles, and workplace contexts
  Names: diverse and realistic. Roles: match the audience's actual job. Stakes must matter.

RULE 33 — 2 choices is better than 4 for scenarios
  2 choices forces a clear contrast: the instinctive reaction vs the trained response.
  This creates the "aha moment" — learners see why their first instinct was wrong.`
  },
  {
    source: "Audience Analysis Framework",
    content: `The 5 Questions to Profile Any Audience (RULE 34):

1. ROLE: What is their job title and day-to-day responsibility?
2. EXPERIENCE: How long have they been in role? What do they already know?
3. MOTIVATION: Do they WANT to learn this, or are they being forced to?
   (Compliance = reluctant learners → hook must create urgency)
   (Skill-building = motivated learners → hook can challenge them)
4. BARRIER: What is stopping them from doing this correctly right now?
   (Knowledge gap? Skill gap? Attitude gap? Confidence gap? Process gap?)
5. WIIFM: What's In It For Me? Every course must answer WIIFM in the first 30 seconds.

RULE 35 — Design for the barrier, not the topic
  Topic: "Customer service training"
  Barrier: "Staff know the process but skip the empathy step because they're rushed"
  The course that fixes the barrier is completely different from the course that covers the topic.

RULE 36 — Reluctant learners need a different hook
  Motivated: Challenge them. Reluctant: Make it relevant fast. Compliance: Make the consequence real.`
  },
  {
    source: "Course Structure — 7-Block Framework",
    content: `Standard 7-block course structure (always follow this sequence):

Block 1 (cover):    Title + subtitle + 2-3 measurable outcomes + duration
Block 2 (stat):     A surprising research stat that creates urgency or reframes thinking
Block 3 (pillars):  The 3 core concepts, framework, or principles (never more than 3)
Block 4 (hotspot):  4 clickable real-world items — practice identifying/applying
Block 5 (scenario): A realistic workplace moment + decision point + consequences
Block 6 (quiz):     3 application questions — test what they would DO, not what they recall
Block 7 (summary):  5 specific action commitments + motivational close

Standard course screen flow:
Cover (objectives stated) → Hook/Stat → Core Content → Scenario Practice → Knowledge Check → Summary

RULE: Every course MUST include minimum 1 scenario block + 1 quiz block.
Cover + stat + pillars alone = L1 only = NOT acceptable for behaviour change.`
  },
  {
    source: "Worked Examples — Soft Skills Manager Feedback",
    content: `EXAMPLE 1: Soft Skills — Manager Feedback
Brief: "Help new managers have better one-on-one conversations with their team"
Audience: First-time managers, 0–12 months in role, reluctant to have tough conversations
Level: L3 behaviour change | Kirkpatrick: Level 3

Course structure:
  Block 1 (cover):   "The Conversation Most Managers Avoid" — 3 outcomes stated
  Block 2 (stat):    "68% of employees say their manager never gives them useful feedback"
  Block 3 (pillars): 3 types of 1-on-1: Check-in / Development / Performance
  Block 4 (hotspot): Anatomy of a good 1-on-1: Agenda, Setting, Opening, Listening, Close
  Block 5 (scenario): Maya just missed her second deadline. A) Bring it up directly B) Wait and see
  Block 6 (quiz):    3 questions testing application of the framework
  Block 7 (summary): "Before your next 1-on-1, do these 5 things"

Objectives:
  - Apply the SBI (Situation-Behaviour-Impact) model when giving feedback
  - Demonstrate active listening techniques during a 1-on-1 conversation
  - Evaluate whether a performance issue requires immediate discussion or monitoring`
  },
  {
    source: "Worked Examples — Compliance Data Privacy",
    content: `EXAMPLE 2: Compliance — Data Privacy
Brief: "All staff must understand GDPR and how it applies to their daily work"
Audience: All employees, mixed roles, reluctant learners (mandatory compliance)
Level: L2 knowledge + awareness | Kirkpatrick: Level 2 + 3

Course structure:
  Block 1 (cover):   "Your Data Decisions Matter" — 3 outcomes, 15 min
  Block 2 (stat):    "1 in 3 data breaches is caused by employee error"
  Block 3 (pillars): 3 GDPR principles: Lawful basis / Data minimisation / Subject rights
  Block 4 (hotspot): 4 everyday situations: Email, Spreadsheets, Customer calls, Printing
  Block 5 (scenario): You receive a customer data request. Manager is away. A) Forward to IT B) Reply directly with data
  Block 6 (quiz):    3 questions on correct data handling procedures
  Block 7 (summary): "Your GDPR checklist — 5 things to do differently from tomorrow"

Objectives:
  - Identify which types of customer data are covered by GDPR
  - Apply the correct process when receiving a Subject Access Request
  - Recognise 3 common data handling mistakes and their consequences`
  },
  {
    source: "Worked Examples — Leadership Decision Making",
    content: `EXAMPLE 4: Leadership — Decision Making Under Pressure
Brief: "Senior leaders need to make faster, better decisions when data is incomplete"
Audience: Directors and VPs, highly experienced, time-scarce, sceptical of training
Level: L3 behaviour change | Kirkpatrick: Level 3

Course structure:
  Block 1 (cover):   "Decide. Don't Deliberate." — 3 outcomes, 12 min
  Block 2 (stat):    "64% of senior leaders cite decision paralysis as their #1 productivity drain"
  Block 3 (pillars): 3 frameworks: OODA Loop / Pre-mortem / Two-way door test
  Block 4 (hotspot): 4 decision traps: Analysis paralysis / Consensus addiction / Recency bias / Sunk cost
  Block 5 (scenario): 3 hours to decide whether to delay a product launch. Conflicting data. Two disagreeing team members.
                       A) Call another meeting B) Make the call using data you have
  Block 6 (quiz):    3 questions applying decision frameworks to real scenarios
  Block 7 (summary): "3 commitments to make before your next high-stakes decision"

Objectives:
  - Apply the two-way door test to categorise decisions by reversibility
  - Evaluate when to consult vs when to decide alone
  - Justify a decision clearly when challenged by a stakeholder`
  },
  {
    source: "Visual Design Strategy",
    content: `Two core design philosophies for e-learning:

MATERIAL DESIGN: Card shapes, bold typography, bright colours, strong imagery.
Best for: content-heavy courses, data-driven topics, tech audiences.

MINIMAL / FLAT DESIGN (recommended): Clean, simple, authentic. Minimum gradients/textures/shadows.
Longer shelf life — stays modern without frequent redesign.
Best for: all audiences, behaviour change, soft skills, leadership.

Visual design must address all 5 dimensions:
  1. Brand colours — primary + secondary + neutral palette
  2. Typography — font family, heading/body/label hierarchy
  3. Imagery — photography style (stock vs brand, tone, diversity)
  4. Icons and shapes — consistent style throughout
  5. Infographics — data visualisation approach

RULE 10 — Visual style must match learning content:
  Behaviour change / soft skills → Minimal/Flat
  Technical / data-driven → Material Design
  Leadership / executive → Clean, typographic, minimal

RULE 11 — Consistent visual language across all 5 dimensions for every course.

RULE 12 — Use infographic blocks (stat, pillars) only for: statistics, comparisons, frameworks.
Do NOT use for narrative or procedural content.`
  },
  {
    source: "Project Management — Content Lock and Risk Rules",
    content: `Project Workflow (Development Life Cycle):
  Stage 1: Analysis and Design — Content Analysis + Enhanced Content Outline (ECO) + SME approval
  Stage 2: Storyboard — Screen-by-screen storyboard + 2 SME reviews + 1 verification round
  Stage 3: Alpha — First built version with machine audio + 1 SME review
  Stage 4: Beta — Refined build with professional voiceover + 1 SME review
  Stage 5: Gold (Final) — Final SCORM package + tested in 2 OS/browser combinations

RULE 14 — Content must be locked before design begins
  Highest project risk: content changes AFTER design/storyboard complete = rework + delays.
  When AI generates a course outline, users must review and approve BEFORE moving to course builder.

RULE 15 — Collect 3 inputs minimum before generating:
  a. Who is the audience? (role, seniority, familiarity)
  b. What is the business need? (what performance gap does training address?)
  c. What does success look like? (which Kirkpatrick level?)

Scope Definition:
  L1 includes: static screens, limited interactions, stock images, professional voiceover, SCORM 2004
  OUT of scope for L1: 3D graphics, custom illustrations, software simulations, custom scenarios, video recording

Risk Rules:
  Risk 1: New content after design = rework. Freeze content before storyboard.
  Risk 2: SME unavailability = timeline slippage. Block SME calendars at project start.
  Risk 3: Content changes after Alpha/Beta = expensive rework. Get sign-off at each stage.`
  }
];

async function embedAll() {
  console.log(`Embedding ${chunks.length} knowledge chunks...`);

  const response = await fetch('http://localhost:3000/api/embed-knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adminKey: 'instrux-admin-2026',
      chunks
    })
  });

  const result = await response.json();
  console.log('\nResult:', JSON.stringify(result, null, 2));
}

embedAll().catch(console.error);

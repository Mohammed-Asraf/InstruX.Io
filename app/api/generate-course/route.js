import { NextResponse } from 'next/server';
import { getOpenAI, retrieveKnowledge } from '../../../lib/ai';

export async function POST(request) {
  try {
    const { prompt, learningGoal } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // RAG: retrieve relevant ID methodology from knowledge base
    const knowledge = await retrieveKnowledge(
      `course design for: ${prompt}, goal: ${learningGoal}`
    );

    const systemPrompt = `You are InstruX, an expert AI instructional designer trained on professional ID methodology.

RELEVANT ID METHODOLOGY FROM YOUR KNOWLEDGE BASE:
${knowledge}

Use the above methodology to guide your course design decisions.
You follow the CRAFT framework: Consult → Refine → Aggregate → Form → Test.
Always start with the learning outcome before deciding on content or format.

Return ONLY valid JSON (no markdown, no backticks) in this exact structure:

{
  "courseTitle": "Compelling outcome-focused title",
  "courseSubtitle": "One sentence — what they will be able to DO",
  "author": "InstruX AI",
  "duration": "15 min",
  "modules": 7,
  "outline": [
    {"title": "string", "stage": "The Hook"},
    {"title": "string", "stage": "Retrieval"},
    {"title": "string", "stage": "Core Skill"},
    {"title": "string", "stage": "Core Skill"},
    {"title": "string", "stage": "Core Skill"},
    {"title": "string", "stage": "Mastery Check"},
    {"title": "string", "stage": "Summary"}
  ],
  "cards": [
    {
      "type": "cover",
      "courseTitle": "string",
      "subtitle": "string (what the learner will be able to DO after this course)",
      "author": "InstruX AI",
      "duration": "15 min",
      "modules": 7,
      "topic": "string (2-3 words)",
      "outcomes": ["Bloom's verb + object", "string", "string"],
      "logic": "Why this block serves the learning goal"
    },
    {
      "type": "stat",
      "title": "string",
      "stat": "string (the number, e.g. 68%)",
      "statLabel": "string (what it means)",
      "body": "string (2-3 sentences — research context and why it matters)",
      "source": "string (realistic source)",
      "logic": "string"
    },
    {
      "type": "pillars",
      "title": "string",
      "subtitle": "string (one sentence framing the 3 pillars)",
      "pillars": [
        {"icon": "emoji", "heading": "string", "body": "string (2 sentences max)"},
        {"icon": "emoji", "heading": "string", "body": "string"},
        {"icon": "emoji", "heading": "string", "body": "string"}
      ],
      "logic": "string"
    },
    {
      "type": "hotspot",
      "title": "string",
      "subtitle": "string (instruction)",
      "items": [
        {"label": "string", "tip": "string (2-3 sentence actionable insight)"},
        {"label": "string", "tip": "string"},
        {"label": "string", "tip": "string"},
        {"label": "string", "tip": "string"}
      ],
      "logic": "string"
    },
    {
      "type": "scenario",
      "title": "string",
      "setup": "string (specific: time, place, character, what just happened — 2-3 sentences)",
      "character": "string (realistic diverse name)",
      "prompt": "string (clear decision question)",
      "choices": [
        {"label": "string (instinctive but wrong response)", "result": "string (realistic consequence explaining WHY this fails)"},
        {"label": "string (trained correct response)", "result": "string (realistic positive consequence)"}
      ],
      "logic": "string"
    },
    {
      "type": "quiz",
      "title": "string",
      "questions": [
        {"q": "string (application question)", "options": ["string","string","string","string"], "answer": 0, "explanation": "string (teaches WHY, 2-3 sentences)"},
        {"q": "string", "options": ["string","string","string","string"], "answer": 1, "explanation": "string"},
        {"q": "string", "options": ["string","string","string","string"], "answer": 2, "explanation": "string"}
      ],
      "logic": "string"
    },
    {
      "type": "summary",
      "title": "string",
      "closing": "string (motivational — connects skill to real-world impact)",
      "cta": "Apply Today",
      "takeaways": ["verb + specific action", "string", "string", "string", "string"],
      "logic": "string"
    }
  ]
}`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Design a course about: "${prompt}"\nLearning goal: ${learningGoal}` }
      ]
    });

    const raw = completion.choices[0].message.content;

    let courseData;
    try {
      courseData = JSON.parse(raw);
    } catch (e) {
      console.error('JSON parse error in generate-course:', e, raw);
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 500 });
    }

    return NextResponse.json(courseData);

  } catch (error) {
    console.error('generate-course error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getOpenAI, retrieveKnowledge } from '../../../lib/ai';

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, subtitle, objectives, modules, learner, gap, outcome, bloomLevel, modality, strategy, structuredFacts, brandKitId } = body;

    if (!modules || !Array.isArray(modules) || modules.length === 0) {
      return NextResponse.json({ error: 'modules array is required' }, { status: 400 });
    }

    // RAG: pull relevant ID methodology
    const knowledge = await retrieveKnowledge(
      `microlearning course design: ${title}, strategy: ${strategy}, bloom level: ${bloomLevel}, learner: ${learner}, gap: ${gap}`
    );

    const systemPrompt = `You are InstruX, a Senior Instructional Designer and Art Director specializing in premium Mobile Microlearning (like 7taps).
Your goal is to build a 5–10 minute card deck that is visually dynamic and engaging.

DESIGN PRINCIPLES:
- Brevity: Body text must be strictly under 150 characters per card.
- Clarity: One single idea per card. No paragraphs.
- Visual Variety: Use the 'designHint' to create a mix of layouts. DO NOT use the same hint twice in a row.
- Visuals: EVERY content, quote, and module-title card MUST include a 'visualPrompt' AND 'imageDecision' field.

IMAGE DECISION RULES (set 'imageDecision' on every content and quote card):
- "canva-ai"   → the concept is physical/visual: a process, object, place, person, diagram, screenshot, data chart, procedure, tool
- "css-pattern" → the concept is abstract/conceptual: frameworks, principles, definitions, mindsets, attitudes, values
- "none"        → quiz, flipcards, checklist, objectives, module-title (never need images)

Examples: "Fire evacuation procedure" → canva-ai | "Importance of communication" → css-pattern | "How to reset a device" → canva-ai | "Bloom's levels" → css-pattern

VISUAL STYLE RULES (set 'visualStyle' on every canva-ai card — pick the one that best fits the content):
- "cinematic"   → People, leadership, workplace scenarios, emotions, storytelling, culture — dramatic film-quality photography
- "illustrated" → Concepts, frameworks, data, abstract ideas that need visual metaphor — premium editorial digital illustration
- "comic"       → Safety, compliance, gamified or fun content, dos-and-don'ts — bold comic book art style
- "3d-render"   → Technology, software, products, systems, architecture — clean photorealistic 3D CGI
- "realistic"   → Physical procedures, equipment, medical, scientific, step-by-step — high-res professional photography

Examples: "Sales conversation skills" → cinematic | "Cloud architecture diagram" → 3d-render | "Fire safety evacuation" → comic | "Quarterly revenue growth" → illustrated | "Lab sample handling" → realistic

ANTI-HALLUCINATION RULES (enforced when structured knowledge is provided):
- Every fact, number, name, threshold, or procedure in a slide MUST come from the verified knowledge below.
- DO NOT use general knowledge about this topic. If the knowledge doesn't cover it, don't include it.
- Quiz scenarios and distractors must reflect real situations from the source, not invented ones.
- Content not grounded in the verified knowledge = a failed course.

RELEVANT ID METHODOLOGY FROM YOUR KNOWLEDGE BASE:
${knowledge}

Design a complete 7taps-style card deck as a JSON ARRAY.
Use ONLY these card types: cover, objectives, module-title, content, video, quote, checklist, flipcards, quiz, summary.

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array. No markdown, no backticks, no wrapper object.
- NO DUMMY CONTENT: Use ONLY specific examples, facts, and terminology from the source material.

CARD SCHEMAS:

cover:
{ 
  "type": "cover", 
  "designHint": "geometric-bg" | "image-full",
  "courseTitle": "string", 
  "subtitle": "ACTION outcome", 
  "totalModules": 1, 
  "estimatedTime": "X min" 
}

objectives:
{ "type": "objectives", "heading": "What you will master", "items": ["Short outcome 1", "Short outcome 2"] }

module-title:
{ "type": "module-title", "moduleNum": 1, "title": "string", "story": "Short 1-sentence narrative bridge" }

content:
{
  "type": "content",
  "designHint": "image-top" | "text-focus" | "split-view",
  "visualPrompt": "REQUIRED. Vivid vertical (9:16) scene description — be hyper-specific (e.g. 'A confident Black female executive presenting quarterly growth data on a glass wall display in a sleek open-plan office, golden hour lighting, shallow depth of field')",
  "imageDecision": "canva-ai" | "css-pattern" | "none",
  "visualStyle": "cinematic" | "illustrated" | "comic" | "3d-render" | "realistic",
  "heading": "string",
  "subtitle": "string or null",
  "body": "STRICTLY MAX 150 CHARS. Practical explanation.",
  "proTip": "STRICTLY MAX 100 CHARS expert callout (null if not needed)"
}

video:
{
  "type": "video",
  "heading": "Watch and Learn",
  "videoPrompt": "Description of the video content needed (e.g., 'A 60-second walkthrough of the CRM dashboard highlights')",
  "keyTakeaway": "150-char max summary of the video"
}

quote:
{
  "type": "quote",
  "designHint": "simple" | "image-bg",
  "visualPrompt": "Vivid vertical background scene description",
  "imageDecision": "canva-ai" | "css-pattern",
  "visualStyle": "cinematic" | "illustrated" | "comic" | "3d-render" | "realistic",
  "text": "High-impact short statement",
  "attribution": "Expert"
}

checklist:
{ "type": "checklist", "heading": "How-To Steps", "items": ["Action 1", "Action 2", "Action 3"] }

flipcards:
{ "type": "flipcards", "heading": "Tap to reveal", "cards": [{ "front": "Concept", "back": "Definition (MAX 120 CHARS)" }] }

quiz:
{ 
  "type": "quiz", 
  "challengeNum": N, 
  "scenario": "1-sentence workplace context",
  "question": "Application question", 
  "instruction": "Tap the correct answer", 
  "options": ["A", "B", "C"], 
  "correctIndices": [0], 
  "feedback": { "correct": "Short reinforcement", "incorrect": "Short correction" }
}

summary:
{ "type": "summary", "heading": "Done!", "subheading": "Action next step", "takeaways": ["Takeaway 1", "Takeaway 2"], "cta": "Export" }`;

    const modulesText = JSON.stringify(modules, null, 2);
    const groundingBlock = structuredFacts
      ? `\nVERIFIED KNOWLEDGE FROM SOURCE (ALL slide content must be traceable to these facts):\nConcepts: ${structuredFacts.concepts?.join(' | ')}\nProcedures: ${structuredFacts.procedures?.join(' | ')}\nRules: ${structuredFacts.rules?.join(' | ')}\nKey Facts: ${structuredFacts.keyFacts?.join(' | ')}\nExamples: ${structuredFacts.examples?.join(' | ')}\n`
      : '';
    const userMessage = `Build a complete microlearning course from this learning map.${groundingBlock}

Course Title: ${title}
Subtitle: ${subtitle || ''}
Learner Population: ${learner}
Performance Gap: ${gap}
Business Outcome: ${outcome}
Bloom's Level: ${bloomLevel}
Delivery Modality: ${modality}
Learning Strategy: ${strategy}

Learning Map (${modules.length} modules):
${modulesText}

Generate all slides following the structure: cover → objectives → [module-title → content slides → flipcards → quiz] × ${modules.length} → summary.
Return ONLY the JSON array.`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 7000,
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: systemPrompt + '\n\nIMPORTANT: You must return a valid JSON object with a single property named "slides" that contains the array of card objects.' },
        { role: 'user', content: userMessage }
      ]
    });

    const raw = completion.choices[0].message.content.trim();

    let slides;
    try {
      const parsedData = JSON.parse(raw);
      slides = parsedData.slides || parsedData; 
      
      if (!Array.isArray(slides)) {
        throw new Error('Parsed JSON does not contain an array of slides');
      }
    } catch (e) {
      console.error('JSON parse error:', e.message, '\nRaw:', raw.substring(0, 500));
      return NextResponse.json({ error: 'AI returned invalid JSON', details: e.message }, { status: 500 });
    }

    // --- Image Generation (Canva AI — brand-consistent, high quality) ---
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    await Promise.allSettled(
      slides.map(async (slide, idx) => {
        if (slide.imageDecision !== 'canva-ai' || !slide.visualPrompt) return;
        try {
          const res = await fetch(`${baseUrl}/api/generate-slide-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              visualPrompt: slide.visualPrompt,
              visualStyle: slide.visualStyle || 'cinematic',
              slideTitle: slide.heading || '',
              brandKitId: brandKitId || undefined
            })
          });
          const data = await res.json();
          if (data.imageUrl) slide.imageUrl = data.imageUrl;
        } catch (err) {
          console.warn(`Canva image skipped slide ${idx}:`, err.message);
        }
      })
    );
    // --- END: Image Generation ---

    return NextResponse.json(slides);

  } catch (error) {
    console.error('build-microlearning error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

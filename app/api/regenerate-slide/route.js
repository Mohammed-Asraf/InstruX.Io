import { NextResponse } from 'next/server';
import { getOpenAI, retrieveKnowledge } from '../../../lib/ai';

export async function POST(request) {
  try {
    const body = await request.json();
    const { slide, courseTitle, learner, gap, bloomLevel, strategy, brandKitId } = body;

    if (!slide || !slide.type) {
      return NextResponse.json({ error: 'slide object with type is required' }, { status: 400 });
    }

    const knowledge = await retrieveKnowledge(
      `microlearning ${slide.type} card: ${slide.heading || slide.title || ''}, course: ${courseTitle}`
    );

    const systemPrompt = `You are InstruX, a Senior Instructional Designer specializing in premium Mobile Microlearning.
Regenerate a single improved slide of the SAME TYPE as the input. Make it more engaging, clearer, and more visually dynamic.

RELEVANT ID METHODOLOGY:
${knowledge}

STRICT OUTPUT RULES:
- Return ONLY a valid JSON object for a single slide. No array, no markdown, no backticks, no wrapper key.
- Keep the EXACT same "type" value as the input slide.
- Body text must be strictly under 150 characters.
- One single idea per card. No paragraphs.

CARD SCHEMAS:

content: { "type": "content", "designHint": "image-top"|"text-focus"|"split-view", "visualPrompt": "REQUIRED vivid vertical 9:16 scene description — hyper-specific", "imageDecision": "canva-ai"|"css-pattern"|"none", "visualStyle": "cinematic"|"illustrated"|"comic"|"3d-render"|"realistic", "heading": "string", "subtitle": "string or null", "body": "MAX 150 CHARS", "proTip": "MAX 100 CHARS or null" }
IMAGE DECISION RULES: "canva-ai" for physical/visual concepts (process, object, place, person, tool); "css-pattern" for abstract concepts (frameworks, principles, attitudes); "none" for quiz/checklist/flipcards.
VISUAL STYLE RULES: cinematic=people/scenarios/leadership, illustrated=concepts/frameworks/data, comic=safety/compliance/fun, 3d-render=tech/software/systems, realistic=procedures/equipment/science.

quote: { "type": "quote", "designHint": "simple"|"image-bg", "visualPrompt": "subtle background description", "text": "High-impact statement", "attribution": "Expert name" }

checklist: { "type": "checklist", "heading": "string", "items": ["Action 1", "Action 2", "Action 3"] }

flipcards: { "type": "flipcards", "heading": "string", "cards": [{ "front": "Concept", "back": "Definition MAX 120 CHARS" }] }

quiz: { "type": "quiz", "challengeNum": 1, "scenario": "1-sentence workplace context", "question": "string", "instruction": "Tap the correct answer", "options": ["A", "B", "C"], "correctIndices": [0], "feedback": { "correct": "Short reinforcement", "incorrect": "Short correction" } }

video: { "type": "video", "heading": "string", "videoPrompt": "description of video content needed", "keyTakeaway": "MAX 150 CHARS" }

objectives: { "type": "objectives", "heading": "string", "items": ["outcome 1", "outcome 2", "outcome 3"] }

module-title: { "type": "module-title", "moduleNum": 1, "title": "string", "story": "Short 1-sentence narrative bridge" }`;

    const userMessage = `Regenerate this slide with fresh, more engaging content. Keep the same type.

Course: ${courseTitle}
Learner: ${learner}
Performance Gap: ${gap}
Bloom's Level: ${bloomLevel}
Strategy: ${strategy}

Current slide to improve:
${JSON.stringify(slide, null, 2)}

Return ONLY the improved JSON object for this single slide.`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.85,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    });

    const raw = completion.choices[0].message.content.trim();
    let newSlide;
    try {
      const parsed = JSON.parse(raw);
      // Unwrap if model wrapped it in a key
      newSlide = parsed.slide || parsed.card || parsed.result || parsed;
    } catch (e) {
      return NextResponse.json({ error: 'AI returned invalid JSON', details: e.message }, { status: 500 });
    }

    // Generate image if the slide uses canva-ai decision
    if (newSlide.imageDecision === 'canva-ai' && newSlide.visualPrompt) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const imgRes = await fetch(`${baseUrl}/api/generate-slide-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visualPrompt: newSlide.visualPrompt,
            visualStyle: newSlide.visualStyle || 'cinematic',
            slideTitle: newSlide.heading || '',
            brandKitId: brandKitId || undefined
          })
        });
        const imgData = await imgRes.json();
        if (imgData.imageUrl) newSlide.imageUrl = imgData.imageUrl;
      } catch (err) {
        console.warn('Canva image skipped for regenerated slide:', err.message);
      }
    }

    return NextResponse.json(newSlide);

  } catch (error) {
    console.error('regenerate-slide error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getOpenAI, retrieveKnowledge } from '../../../lib/ai';

export async function POST(request) {
  try {
    const { content, structuredFacts, learner, gap, outcome, strategy, smeAnswers, aiGenerateContent } = await request.json();

    if ((!content || content.trim().length < 10) && !aiGenerateContent) {
      return NextResponse.json({ error: 'Content is too short. Please provide more material or choose AI Generation mode.' }, { status: 400 });
    }

    if (!strategy) {
      return NextResponse.json({ error: 'Strategy is required' }, { status: 400 });
    }

    // Retrieve methodology specific to the chosen strategy
    const knowledge = await retrieveKnowledge(
      `learning map design ${strategy} strategy Bloom's Kirkpatrick module mapping SOURCE 11`
    );

    const smeContext = smeAnswers && smeAnswers.length > 0
      ? `\nSME answers provided:\n${smeAnswers.map((a, i) => `Q${i + 1}: ${a}`).join('\n')}`
      : '';

    const systemPrompt = `You are a Senior Instructional Designer specializing in high-end Mobile Microlearning (like 7taps and EdApp).
Your goal is to transform source content into a 3–10 minute "Mobile Learning Map" (ideally 5 minutes).

RELEVANT ID METHODOLOGY FROM YOUR KNOWLEDGE BASE (STRICTLY FOLLOW SOURCE 11):
${knowledge}

${aiGenerateContent 
  ? "MODE: KNOWLEDGE GENERATION. The user has only provided a topic/short text. Use your 25 years of expert ID knowledge to generate a high-quality, practical, and factually accurate course from this topic." 
  : "MODE: STRICT GROUNDING. Use ONLY the provided source material and SME insights. DO NOT add outside facts or 'dummy' content. If the content is insufficient for a card, summarize what IS there rather than making things up."}

MOBILE-FIRST DESIGN STANDARDS:
- Total Duration: Strictly 3–10 minutes. NEVER exceed 10 minutes.
- Structure: A single, cohesive sequence of 10–15 "Mobile Cards".
- Video Selection (RULE 37): Use "Concept Video" ONLY if the content requires a physical or software demonstration. Otherwise, use "Concept Card" with a high-impact visual.
- Cognitive Load: Focus on ONE primary learning objective. Remove all "nice-to-know" fluff.
- Pacing: 15–45 seconds per card.

Topic/Content Provided: ${content}
Strategy selected: ${strategy}
Learner profile: ${learner}
Performance gap: ${gap}
Business outcome (Kirkpatrick L4): ${outcome}
${smeContext}

MOBILE INTERACTION FORMATS:
- Concept Card: 1 key idea + 1 visual prompt (Standard content).
- Concept Video: 60-90s video (Use ONLY if demonstration is required - Rule 37).
- Interaction Card: Quick tap-to-reveal or flipcard.
- Scenario Card: 1-sentence challenge + immediate feedback.
- Knowledge Check: 1-question rapid-fire quiz.
- Summary Card: 3 actionable takeaways.

Return ONLY valid JSON:
{
  "title": "Course title",
  "subtitle": "Outcome-focused subtitle (e.g., 'Master the 3 steps of...')",
  "objectives": ["The single primary objective for this micro-course"],
  "totalCards": 12,
  "estimatedTime": "5 min",
  "modules": [
    {
      "title": "Learning Sequence",
      "story": "The narrative bridge connecting the source material to the learner's reality",
      "rows": [
        {
          "topic": "Card title",
          "ref": "Source Section",
          "time": 0.5,
          "format": "Concept Card | Concept Video | Interaction Card | Scenario Card | Knowledge Check",
          "screen": "Mobile-first description: what the user sees and taps on their phone screen."
        }
      ]
    }
  ]
}`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: structuredFacts
            ? `VERIFIED KNOWLEDGE EXTRACTED FROM SOURCE (STRICT GROUNDING — every card ref must cite a specific item from this list):\nConcepts: ${structuredFacts.concepts?.slice(0,10).join(' | ')}\nProcedures: ${structuredFacts.procedures?.slice(0,8).join(' | ')}\nRules: ${structuredFacts.rules?.slice(0,8).join(' | ')}\nKey Facts: ${structuredFacts.keyFacts?.slice(0,10).join(' | ')}\nExamples: ${structuredFacts.examples?.slice(0,5).join(' | ')}\nContent Gaps addressed by SME: ${structuredFacts.contentGaps?.slice(0,4).join(' | ') || 'none'}\nSource Bloom\'s Level: ${structuredFacts.bloomsLevel || 'Apply / Analyse'}`
            : `Source content:\n${(content || '').substring(0, 4000)}` }
      ]
    });

    const raw = completion.choices[0].message.content;

    let result;
    try {
      result = JSON.parse(raw);
    } catch (e) {
      console.error('JSON parse error in generate-learning-map:', e, raw);
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 500 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('generate-learning-map error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getOpenAI, retrieveKnowledge } from '../../../lib/ai.js';

export const maxDuration = 60;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: CORS });
}

export async function POST(request) {
  try {
    const { text, images = [], learner, gap, outcome } = await request.json();

    if (!text || text.trim().length < 20) {
      return NextResponse.json({ error: 'Text content required' }, { status: 400, headers: CORS });
    }

    const knowledge = await retrieveKnowledge(
      `content extraction analysis gap identification: ${text.substring(0, 200)}`
    );

    const systemPrompt = `You are a Senior Instructional Designer performing a rigorous content audit before building a training course.
Your ONLY job is to extract what is EXPLICITLY stated in the source content — never infer, never hallucinate, never add general knowledge.

CRITICAL RULES:
- "concepts": definitions, named things, and ideas STATED in the content
- "procedures": step-by-step processes DESCRIBED in the content
- "rules": constraints, policies, must-do/must-not-do STATED in the content
- "examples": specific case studies, scenarios, or worked examples IN the content
- "keyFacts": specific numbers, dates, thresholds, percentages, names IN the content
- "contentGaps": what a learner would need to know (given the gap/outcome context) that is NOT addressed in this content
- "imageSummaries": for each image — what it shows and what information it contains (empty array if no images)
- "bloomsLevel": highest cognitive level this content can support: Remember|Understand|Apply|Analyse|Evaluate|Create
- "estimatedComplexity": basic|intermediate|advanced

ID METHODOLOGY:
${knowledge}

If an image is a diagram or flowchart: describe the full sequence.
If an image is a chart: describe the data shown.
If an image is a screenshot: describe what is visible on screen.

Return ONLY valid JSON — no markdown, no explanation outside the JSON object.`;

    // Split images into two tiers:
    // - ocrRich: OCR returned ≥ 30 chars → fold text into prompt, no Vision API call
    // - needsVision: OCR returned < 30 chars (diagrams, charts, photos) → send to GPT-4o Vision
    const OCR_THRESHOLD = 30;
    const ocrTexts = [];
    const needsVision = [];
    for (const img of images) {
      if (img.ocrText && img.ocrText.length >= OCR_THRESHOLD) {
        ocrTexts.push(img.ocrText);
      } else if (img.base64 && img.mimeType) {
        needsVision.push(img);
      }
    }

    const ocrBlock = ocrTexts.length
      ? `\n\nTEXT EXTRACTED FROM IMAGES (via OCR — treat as part of source content):\n${ocrTexts.join('\n---\n')}`
      : '';

    const userParts = [
      {
        type: 'text',
        text: `SOURCE CONTENT TO ANALYSE:\n---\n${text.substring(0, 12000)}${ocrBlock}\n---\n\nContext:\nLearner population: ${learner || 'not specified'}\nPerformance gap: ${gap || 'not specified'}\nBusiness outcome: ${outcome || 'not specified'}\n\nExtract ALL facts explicitly present in the content above. Be exhaustive and specific.`
      }
    ];

    // Only send images that Tesseract couldn't read (true diagrams/charts/photos)
    for (const img of needsVision) {
      userParts.push({
        type: 'image_url',
        image_url: { url: `data:${img.mimeType};base64,${img.base64}`, detail: 'low' }
      });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      temperature: 0,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userParts.length > 1 ? userParts : userParts[0].text }
      ]
    });

    const result = JSON.parse(completion.choices[0].message.content);

    const safe = {
      concepts:            Array.isArray(result.concepts)        ? result.concepts        : [],
      procedures:          Array.isArray(result.procedures)      ? result.procedures      : [],
      rules:               Array.isArray(result.rules)           ? result.rules           : [],
      examples:            Array.isArray(result.examples)        ? result.examples        : [],
      keyFacts:            Array.isArray(result.keyFacts)        ? result.keyFacts        : [],
      contentGaps:         Array.isArray(result.contentGaps)     ? result.contentGaps     : [],
      imageSummaries:      Array.isArray(result.imageSummaries)  ? result.imageSummaries  : [],
      bloomsLevel:         result.bloomsLevel         || 'Apply / Analyse',
      estimatedComplexity: result.estimatedComplexity || 'intermediate',
    };

    return NextResponse.json(safe, { headers: CORS });

  } catch (err) {
    console.error('analyse-content error:', err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS });
  }
}

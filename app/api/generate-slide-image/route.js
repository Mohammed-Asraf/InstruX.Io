import { NextResponse } from 'next/server';
import { getOpenAI } from '../../../lib/ai';

export async function POST(request) {
  try {
    const { visualPrompt, slideTitle, brandKitId } = await request.json();

    if (!visualPrompt) return NextResponse.json({ imageUrl: null });

    const enhancedPrompt = `${visualPrompt}. Professional microlearning slide visual, vertical portrait format, photorealistic, clean and modern.`;

    const imgRes = await getOpenAI().images.generate({
      model: 'dall-e-3',
      prompt: enhancedPrompt.substring(0, 3900),
      n: 1,
      size: '1024x1792',
      quality: 'standard',
      response_format: 'b64_json'
    });

    const base64 = imgRes.data[0].b64_json;
    return NextResponse.json({ imageUrl: `data:image/png;base64,${base64}` });

  } catch (err) {
    console.warn('DALL-E 3 image generation failed:', err.message);
    return NextResponse.json({ imageUrl: null });
  }
}

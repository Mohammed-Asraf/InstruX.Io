import { NextResponse } from 'next/server';
import { getOpenAI, getSupabase } from '../../../lib/ai';
import { randomUUID } from 'crypto';

export async function POST(request) {
  try {
    const { visualPrompt, visualStyle, slideTitle, brandKitId } = await request.json();

    if (!visualPrompt) return NextResponse.json({ imageUrl: null });

    // Style-specific prompt suffixes for DALL-E 3
    const styleGuide = {
      cinematic:   'Cinematic film still, dramatic moody lighting, shallow depth of field, anamorphic lens flare, rich colour grading, movie-quality composition, 8K resolution, vertical 9:16 portrait frame',
      illustrated: 'Premium editorial digital illustration, clean vector-like art with subtle texture, vibrant professional colour palette, Headspace/Duolingo aesthetic, flat depth with detail accents, vertical 9:16 portrait',
      comic:       'Bold comic book illustration, thick ink outlines, halftone dot shading, saturated vivid colours, dynamic action composition, Marvel/DC graphic novel style, vertical 9:16 portrait frame',
      '3d-render': 'High-quality 3D CGI render, Octane/Blender quality, soft studio lighting, photorealistic materials and reflections, clean minimal background, vertical 9:16 portrait format',
      realistic:   'Professional photography, natural soft lighting, Sony A7 85mm f/1.8, ultra-sharp focus, high resolution detail, documentary-style composition, vertical 9:16 portrait frame',
    };
    const styleSuffix = styleGuide[visualStyle] || styleGuide.cinematic;
    const enhancedPrompt = `${visualPrompt}. ${styleSuffix}. No text, no logos, no watermarks.`;

    const imgRes = await getOpenAI().images.generate({
      model: 'dall-e-3',
      prompt: enhancedPrompt.substring(0, 3900),
      n: 1,
      size: '1024x1792',
      quality: 'standard',
      response_format: 'b64_json'
    });

    const base64 = imgRes.data[0].b64_json;
    const buffer = Buffer.from(base64, 'base64');

    // Upload to Supabase Storage so share links can use the public URL
    try {
      const path = `slides/${randomUUID()}.png`;
      const supabase = getSupabase();
      const { error } = await supabase.storage
        .from('Course_Images')
        .upload(path, buffer, { contentType: 'image/png', upsert: false });

      if (error) console.warn('Storage upload error:', JSON.stringify(error));
      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('Course_Images')
          .getPublicUrl(path);
        return NextResponse.json({ imageUrl: publicUrl });
      }
    } catch (uploadErr) {
      console.warn('Storage upload failed, falling back to base64:', uploadErr.message);
    }

    // Fallback: return base64 if storage upload fails
    return NextResponse.json({ imageUrl: `data:image/png;base64,${base64}` });

  } catch (err) {
    console.warn('DALL-E 3 image generation failed:', err.message);
    return NextResponse.json({ imageUrl: null });
  }
}

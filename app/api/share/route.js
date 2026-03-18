import { NextResponse } from 'next/server';
import { getSupabase } from '../../../lib/ai.js';
import { randomUUID } from 'crypto';

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
    const { title, slides, learner, strategy, bloomLevel } = await request.json();

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json({ error: 'slides array is required' }, { status: 400, headers: CORS });
    }

    const id = randomUUID();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Upload base64 images to Supabase Storage, replace with public URLs
    const supabase = getSupabase();
    const slidesClean = await Promise.all(slides.map(async (s) => {
      if (!s.imageUrl || !s.imageUrl.startsWith('data:')) return s;
      try {
        const matches = s.imageUrl.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!matches) return { ...s, imageUrl: undefined };
        const mimeType = matches[1];
        const ext = mimeType === 'image/png' ? 'png' : 'jpg';
        const buffer = Buffer.from(matches[2], 'base64');
        const path = `${id}/${randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('course-images')
          .upload(path, buffer, { contentType: mimeType, upsert: false });
        if (uploadError) {
          console.warn('Image upload failed:', uploadError.message);
          const { imageUrl, ...rest } = s;
          return rest;
        }
        const { data: { publicUrl } } = supabase.storage
          .from('course-images')
          .getPublicUrl(path);
        return { ...s, imageUrl: publicUrl };
      } catch (e) {
        console.warn('Image processing failed:', e.message);
        const { imageUrl, ...rest } = s;
        return rest;
      }
    }));

    const { error } = await getSupabase()
      .from('shared_courses')
      .insert({
        id,
        title: title || 'Untitled Course',
        slides: slidesClean,
        learner: learner || null,
        strategy: strategy || null,
        bloom_level: bloomLevel || null,
      });

    if (error) {
      console.error('share insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
    }

    return NextResponse.json(
      { id, url: `${baseUrl}/share/${id}` },
      { headers: CORS }
    );
  } catch (err) {
    console.error('share route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS });
  }
}

import { NextResponse } from 'next/server';
import { getSupabase } from '../../../lib/ai.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const DEFAULT_CREDITS = 5;

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: CORS });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400, headers: CORS });

    const sb = getSupabase();
    const { data, error } = await sb.from('user_credits').select('credits, total_builds').eq('user_id', userId).single();

    if (error && error.code === 'PGRST116') {
      // User doesn't exist yet — return defaults, will be created on first build
      return NextResponse.json({ credits: DEFAULT_CREDITS, totalBuilds: 0, isNew: true }, { headers: CORS });
    }
    if (error) throw error;

    return NextResponse.json({ credits: data.credits, totalBuilds: data.total_builds }, { headers: CORS });
  } catch (err) {
    console.error('credits GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS });
  }
}

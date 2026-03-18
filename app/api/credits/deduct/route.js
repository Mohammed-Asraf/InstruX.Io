import { NextResponse } from 'next/server';
import { getSupabase } from '../../../../lib/ai.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const DEFAULT_CREDITS = 5;

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: CORS });
}

export async function POST(request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400, headers: CORS });

    const sb = getSupabase();

    // Get or create user
    let { data, error } = await sb.from('user_credits').select('credits, total_builds').eq('user_id', userId).single();

    if (error && error.code === 'PGRST116') {
      // Create new user with default credits, then deduct 1
      const { data: inserted, error: insertErr } = await sb
        .from('user_credits')
        .insert({ user_id: userId, credits: DEFAULT_CREDITS - 1, total_builds: 1 })
        .select('credits, total_builds')
        .single();
      if (insertErr) throw insertErr;
      return NextResponse.json({ credits: inserted.credits, totalBuilds: inserted.total_builds }, { headers: CORS });
    }
    if (error) throw error;

    if (data.credits <= 0) {
      return NextResponse.json({ error: 'No credits remaining', code: 'NO_CREDITS' }, { status: 402, headers: CORS });
    }

    const { data: updated, error: updateErr } = await sb
      .from('user_credits')
      .update({ credits: data.credits - 1, total_builds: data.total_builds + 1 })
      .eq('user_id', userId)
      .select('credits, total_builds')
      .single();
    if (updateErr) throw updateErr;

    return NextResponse.json({ credits: updated.credits, totalBuilds: updated.total_builds }, { headers: CORS });
  } catch (err) {
    console.error('credits deduct error:', err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: CORS });
  }
}

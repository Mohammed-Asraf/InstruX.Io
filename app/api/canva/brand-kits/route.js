import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const token = process.env.CANVA_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'CANVA_ACCESS_TOKEN not set' }, { status: 500 });
    }

    const res = await fetch('https://api.canva.com/rest/v1/brand-kits', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Canva API ${res.status}`, details: err }, { status: res.status });
    }

    const data = await res.json();

    // Normalise — Canva returns items in data.items or data.brand_kits
    const kits = data.items || data.brand_kits || [];

    return NextResponse.json({ brandKits: kits });

  } catch (err) {
    console.error('canva/brand-kits error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

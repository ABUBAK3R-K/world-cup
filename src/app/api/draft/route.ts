import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const team = searchParams.get('team');
    const year = searchParams.get('year');

    if (!team || !year || team === 'undefined' || year === 'undefined' || team === 'null' || year === 'null') {
      return NextResponse.json({ error: "Missing team or year parameters", options: [] }, { status: 400 });
    }

    const squadPlayers = await prisma.playerVersion.findMany({
      where: { 
        player: { country: team },
        worldCupYear: parseInt(year)
      },
      include: { player: true }
    });

    return NextResponse.json({ options: squadPlayers });
  } catch (error) {
    console.error("Draft API error:", error);
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}

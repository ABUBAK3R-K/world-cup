import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const allVersions = await prisma.playerVersion.findMany({
      select: {
        worldCupYear: true,
        player: { select: { country: true } }
      }
    });

    const uniqueTeamsMap = new Map<string, { team: string, year: number }>();
    allVersions.forEach(v => {
      const key = `${v.player.country}-${v.worldCupYear}`;
      if (!uniqueTeamsMap.has(key)) {
        uniqueTeamsMap.set(key, { team: v.player.country, year: v.worldCupYear });
      }
    });
    
    const uniqueTeams = Array.from(uniqueTeamsMap.values());
    if (uniqueTeams.length === 0) {
      return NextResponse.json({ error: "No teams found" }, { status: 404 });
    }

    const randomPick = uniqueTeams[Math.floor(Math.random() * uniqueTeams.length)];
    return NextResponse.json({ team: randomPick.team, year: randomPick.year });
  } catch (error) {
    console.error("Spin API error:", error);
    return NextResponse.json({ error: "Failed to spin" }, { status: 500 });
  }
}

import { LeaderboardClient } from "@/components/leaderboard/leaderboard-client";
import { getPublicLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const board = await getPublicLeaderboard("all");

  return (
    <LeaderboardClient
      initial={{ entries: board.entries, champions: board.champions }}
    />
  );
}

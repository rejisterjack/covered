import { LeaderboardClient } from "@/components/leaderboard/leaderboard-client";
import { getPublicLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Leaderboard",
  description: "Public Covered leaderboard",
};

export default async function EmbedLeaderboardPage() {
  const board = await getPublicLeaderboard("all");

  return (
    <LeaderboardClient
      embed
      initial={{ entries: board.entries, champions: board.champions }}
    />
  );
}

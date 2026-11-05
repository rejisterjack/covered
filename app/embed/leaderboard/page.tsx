import { LeaderboardClient } from "@/components/leaderboard/leaderboard-client";

export const metadata = {
  title: "Leaderboard",
  description: "Public Covered leaderboard",
};

export default function EmbedLeaderboardPage() {
  return <LeaderboardClient embed />;
}

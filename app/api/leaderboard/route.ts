import { getPublicLeaderboard } from "@/lib/leaderboard";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") === "month" ? "month" : "all";

  try {
    const board = await getPublicLeaderboard(period);

    return jsonOk({
      period,
      entries: board.entries,
      champions: board.champions,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Leaderboard failed",
      500,
    );
  }
}

import { getLeaderboard } from "@/lib/bills";
import { jsonError, jsonOk } from "@/lib/http";
import { serializeLeaderboardRow } from "@/lib/serializers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") === "month" ? "month" : "all";

  try {
    const rows = await getLeaderboard(period);

    return jsonOk({
      period,
      entries: rows
        .map((row, index) => {
          if (!row) return null;
          const periodTotal =
            "periodTotal" in row ? Number(row.periodTotal) : undefined;
          const periodCount =
            "periodCount" in row ? Number(row.periodCount) : undefined;

          return serializeLeaderboardRow(row, index + 1, {
            anonymous: row.isAnonymousDefault,
            periodTotal,
            periodCount,
          });
        })
        .filter(Boolean),
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Leaderboard failed",
      500,
    );
  }
}

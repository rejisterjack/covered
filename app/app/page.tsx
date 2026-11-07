import { FeedClient } from "@/components/feed/feed-client";
import { listBills } from "@/lib/bills";
import { serializeBillCard } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export default async function AppFeedPage() {
  const bills = await listBills({ tab: "new" });

  return <FeedClient initialBills={bills.map((bill) => serializeBillCard(bill))} />;
}

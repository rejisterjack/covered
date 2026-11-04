import { redirect } from "next/navigation";

import { AdminConsole } from "@/components/admin/admin-console";
import { requireAdminSession } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdminSession();

  if (!admin) {
    redirect("/");
  }

  return <AdminConsole />;
}

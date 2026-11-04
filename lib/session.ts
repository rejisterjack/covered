import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireSession() {
  const session = await getSession();

  if (!session?.user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return session;
}

export async function getSessionFromRequest(request: Request) {
  return auth.api.getSession({
    headers: request.headers,
  });
}

export async function requireUser(request: Request) {
  const session = await getSessionFromRequest(request);

  if (!session?.user) {
    return null;
  }

  return session;
}

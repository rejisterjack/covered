import { describe, expect, it } from "vitest";

import { generateInviteCode } from "@/lib/invites";

describe("invite codes", () => {
  it("mints uppercase hex codes of fixed length", () => {
    const code = generateInviteCode();

    expect(code).toMatch(/^[0-9A-F]{8}$/);
  });
});

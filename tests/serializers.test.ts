import { describe, expect, it } from "vitest";

import { publicName, serializeBillCard } from "../lib/serializers";

describe("serializers", () => {
  it("uses first name only", () => {
    expect(publicName("Asha Rao")).toBe("Asha");
  });

  it("omits payment handles from cards", () => {
    const card = serializeBillCard({
      id: "b1",
      posterId: "u1",
      amount: 1000 as unknown as never,
      currency: "INR",
      category: "utilities" as never,
      billerName: "MSEB",
      referenceNo: "ACC123",
      dueDate: new Date("2026-04-01T00:00:00.000Z"),
      story: "Need help",
      imageUrl: "https://example.com/bill.png",
      paymentHandle: "secret@upi",
      paymentType: "upi" as never,
      paymentQrUrl: null,
      locationCity: "Pune",
      latitude: null,
      longitude: null,
      status: "open" as never,
      coveredById: null,
      coveredAt: null,
      viewsCount: 1,
      coverIntentCount: 0,
      deletedAt: null,
      createdAt: new Date("2026-03-26T00:00:00.000Z"),
      updatedAt: new Date("2026-03-26T00:00:00.000Z"),
      poster: {
        id: "u1",
        name: "Asha Rao",
        city: "Pune",
        image: null,
        isVerifiedPublic: false,
      },
    });

    expect(card).not.toHaveProperty("paymentHandle");
    expect(JSON.stringify(card)).not.toContain("secret@upi");
    expect(card.poster.firstName).toBe("Asha");
  });
});

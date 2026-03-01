import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "test-user-2",
    email: "test2@example.com",
    name: "Test User 2",
    loginMethod: "local",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("relationshipScore router", () => {
  it("should update relationship score", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.relationshipScore.update({
      score: 75,
      factors: {
        communication: 80,
        trust: 70,
        intimacy: 75,
      },
    });

    expect(result).toBeDefined();
    expect(result?.score).toBe(75);
  });

  it("should get relationship score", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First update
    await caller.relationshipScore.update({
      score: 65,
    });

    // Then get
    const result = await caller.relationshipScore.get();

    expect(result).toBeDefined();
    expect(result?.score).toBe(65);
  });

  it("should handle score between 0 and 100", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.relationshipScore.update({
      score: 50,
    });

    expect(result?.score).toBeGreaterThanOrEqual(0);
    expect(result?.score).toBeLessThanOrEqual(100);
  });
});

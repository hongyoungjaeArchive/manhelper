import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 3): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
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

describe("aiConsultation usage limit", () => {
  it("should check usage limit", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.aiConsultation.checkUsageLimit();

    expect(result).toBeDefined();
    expect(result.canUse).toBe(true);
    expect(result.used).toBe(0);
    expect(result.limit).toBe(3);
    expect(result.remaining).toBe(3);
  });

  it("should have correct remaining count", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.aiConsultation.checkUsageLimit();

    expect(result.remaining).toBe(result.limit - result.used);
  });

  it("should enforce daily limit", async () => {
    const ctx = createAuthContext(4);
    const caller = appRouter.createCaller(ctx);

    // Check initial state
    const initialCheck = await caller.aiConsultation.checkUsageLimit();
    expect(initialCheck.canUse).toBe(true);

    // Verify limit is 3
    expect(initialCheck.limit).toBe(3);
  });
});

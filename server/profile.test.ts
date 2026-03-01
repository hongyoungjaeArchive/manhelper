import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-1",
    email: "test@example.com",
    name: "Test User",
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

describe("profile router", () => {
  it("should upsert user profile", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.profile.upsert({
      nickname: "테스트유저",
      relationshipType: "dating",
      partnerName: "상대방",
      startDate: new Date("2024-01-01"),
      contactFrequency: 7,
      onboardingCompleted: true,
    });

    expect(result).toBeDefined();
    expect(result?.nickname).toBe("테스트유저");
    expect(result?.partnerName).toBe("상대방");
    expect(result?.relationshipType).toBe("dating");
  });

  it("should get user profile", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First upsert
    await caller.profile.upsert({
      nickname: "테스트유저",
      relationshipType: "dating",
      partnerName: "상대방",
      contactFrequency: 7,
    });

    // Then get
    const result = await caller.profile.get();

    expect(result).toBeDefined();
    expect(result?.nickname).toBe("테스트유저");
  });
});

// In-memory storage (data resets on server restart)
// Replace with a real database later

import type {
  User, InsertUser,
  UserProfile, InsertUserProfile,
  RelationshipScore,
  Reminder, InsertReminder,
  AiConsultation, InsertAiConsultation,
  DailyUsageTracking,
  RecommendedMessage, InsertRecommendedMessage,
} from "../drizzle/schema";

const now = () => new Date().toISOString();
let nextId = 1;
const id = () => nextId++;

const users = new Map<string, User>(); // keyed by openId
const usersByEmail = new Map<string, string>(); // email -> openId
const profiles = new Map<number, UserProfile>(); // userId
const scores = new Map<number, RelationshipScore>(); // userId
const remindersStore = new Map<number, Reminder[]>(); // userId
const consultations = new Map<number, AiConsultation[]>(); // userId
const usageTracking = new Map<string, DailyUsageTracking>(); // `${userId}:${date}`
const messages = new Map<number, RecommendedMessage[]>(); // userId

export function getDb() { return true; } // compatibility shim

export async function upsertUser(user: InsertUser): Promise<void> {
  const existing = users.get(user.openId);
  const ts = now();
  if (existing) {
    users.set(user.openId, { ...existing, ...user, updatedAt: ts });
  } else {
    const newUser: User = {
      id: id(), openId: user.openId, name: user.name ?? null,
      email: user.email ?? null, passwordHash: user.passwordHash ?? null,
      loginMethod: user.loginMethod ?? null, role: user.role ?? "user",
      createdAt: ts, updatedAt: ts, lastSignedIn: ts,
    };
    users.set(user.openId, newUser);
    if (newUser.email) usersByEmail.set(newUser.email, user.openId);
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  return users.get(openId);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const openId = usersByEmail.get(email);
  return openId ? users.get(openId) : undefined;
}

export async function createLocalUser(insert: InsertUser & { passwordHash?: string | null }): Promise<User | undefined> {
  const ts = now();
  const newUser: User = {
    id: id(), openId: insert.openId, name: insert.name ?? null,
    email: insert.email ?? null, passwordHash: insert.passwordHash ?? null,
    loginMethod: insert.loginMethod ?? "local", role: "user",
    createdAt: ts, updatedAt: ts, lastSignedIn: ts,
  };
  users.set(insert.openId, newUser);
  if (newUser.email) usersByEmail.set(newUser.email, insert.openId);
  return newUser;
}

export async function getUserProfile(userId: number): Promise<UserProfile | undefined> {
  return profiles.get(userId);
}

export async function upsertUserProfile(userId: number, profile: Omit<InsertUserProfile, 'userId'>): Promise<UserProfile | undefined> {
  const ts = now();
  const existing = profiles.get(userId);
  const updated: UserProfile = {
    id: existing?.id ?? id(), userId,
    nickname: profile.nickname ?? existing?.nickname ?? "",
    relationshipType: profile.relationshipType ?? existing?.relationshipType ?? "dating",
    partnerName: profile.partnerName ?? existing?.partnerName ?? "",
    startDate: profile.startDate ?? existing?.startDate ?? null,
    lastMetDate: profile.lastMetDate ?? existing?.lastMetDate ?? null,
    lastConflictDate: profile.lastConflictDate ?? existing?.lastConflictDate ?? null,
    contactFrequency: profile.contactFrequency ?? existing?.contactFrequency ?? 7,
    notes: profile.notes ?? existing?.notes ?? null,
    onboardingCompleted: profile.onboardingCompleted ?? existing?.onboardingCompleted ?? false,
    createdAt: existing?.createdAt ?? ts, updatedAt: ts,
  };
  profiles.set(userId, updated);
  return updated;
}

export async function getRelationshipScore(userId: number): Promise<RelationshipScore | undefined> {
  return scores.get(userId);
}

export async function upsertRelationshipScore(userId: number, score: number, factors?: Record<string, number> | Record<string, unknown>): Promise<RelationshipScore | undefined> {
  const ts = now();
  const existing = scores.get(userId);
  const updated: RelationshipScore = {
    id: existing?.id ?? id(), userId, score,
    factors: (factors as RelationshipScore["factors"]) ?? existing?.factors ?? null,
    lastUpdated: ts, createdAt: existing?.createdAt ?? ts,
  };
  scores.set(userId, updated);
  return updated;
}

export async function getUserReminders(userId: number): Promise<Reminder[]> {
  return remindersStore.get(userId) ?? [];
}

export async function createReminder(userId: number, reminder: Omit<InsertReminder, 'userId'>): Promise<void> {
  const ts = now();
  const list = remindersStore.get(userId) ?? [];
  list.push({
    id: id(), userId,
    title: reminder.title ?? "", type: reminder.type ?? "other",
    dueDate: reminder.dueDate ?? ts, description: reminder.description ?? null,
    completed: reminder.completed ?? false, createdAt: ts, updatedAt: ts,
  });
  remindersStore.set(userId, list);
}

export async function createAiConsultation(userId: number, consultation: Omit<InsertAiConsultation, 'userId'>): Promise<void> {
  const ts = now();
  const list = consultations.get(userId) ?? [];
  list.push({
    id: id(), userId,
    consultationType: consultation.consultationType ?? "other",
    userInput: consultation.userInput ?? "", aiResponse: consultation.aiResponse ?? "",
    metadata: consultation.metadata ?? null, createdAt: ts,
  });
  consultations.set(userId, list);
}

export async function getUserAiConsultations(userId: number, limit: number = 10): Promise<AiConsultation[]> {
  const list = consultations.get(userId) ?? [];
  return list.slice(-limit).reverse();
}

export async function getDailyUsageTracking(userId: number, usageDate: string): Promise<DailyUsageTracking | undefined> {
  return usageTracking.get(`${userId}:${usageDate}`);
}

export async function incrementDailyUsage(userId: number, usageDate: string): Promise<DailyUsageTracking | undefined> {
  const key = `${userId}:${usageDate}`;
  const ts = now();
  const existing = usageTracking.get(key);
  const updated: DailyUsageTracking = {
    id: existing?.id ?? id(), userId, usageDate,
    consultationCount: (existing?.consultationCount ?? 0) + 1,
    maxAllowed: existing?.maxAllowed ?? 3,
    tier: existing?.tier ?? "free",
    createdAt: existing?.createdAt ?? ts, updatedAt: ts,
  };
  usageTracking.set(key, updated);
  return updated;
}

export async function createRecommendedMessage(userId: number, message: Omit<InsertRecommendedMessage, 'userId'>): Promise<void> {
  const ts = now();
  const list = messages.get(userId) ?? [];
  list.push({
    id: id(), userId, consultationId: message.consultationId ?? null,
    message: message.message ?? "", context: message.context ?? null,
    category: message.category ?? null, copied: message.copied ?? false,
    used: message.used ?? false, createdAt: ts,
  });
  messages.set(userId, list);
}

export async function getUserRecommendedMessages(userId: number): Promise<RecommendedMessage[]> {
  return (messages.get(userId) ?? []).slice().reverse();
}

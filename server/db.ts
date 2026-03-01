// Persistent in-memory storage with JSON file backup
// Data is saved to a JSON file after every write, and loaded on startup

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import type {
  User, InsertUser,
  UserProfile, InsertUserProfile,
  RelationshipScore,
  Reminder, InsertReminder,
  AiConsultation, InsertAiConsultation,
  DailyUsageTracking,
  RecommendedMessage, InsertRecommendedMessage,
} from "../drizzle/schema";

// ------- persistence file path -------
const DATA_FILE = process.env.DATA_FILE_PATH ?? "./loviq_data.json";
const dataPath = resolve(DATA_FILE);

const now = () => new Date().toISOString();
let nextId = 1;
const idGen = () => nextId++;

const users = new Map<string, User>();          // openId → User
const usersByEmail = new Map<string, string>(); // email → openId
const profiles = new Map<number, UserProfile>();
const scores = new Map<number, RelationshipScore>();
const remindersStore = new Map<number, Reminder[]>();
const consultations = new Map<number, AiConsultation[]>();
const usageTracking = new Map<string, DailyUsageTracking>(); // `${userId}:${date}`
const messages = new Map<number, RecommendedMessage[]>();

// ------- persistence helpers -------
function saveData(): void {
  try {
    const data = {
      nextId,
      users: Array.from(users.entries()),
      usersByEmail: Array.from(usersByEmail.entries()),
      profiles: Array.from(profiles.entries()),
      scores: Array.from(scores.entries()),
      remindersStore: Array.from(remindersStore.entries()),
      consultations: Array.from(consultations.entries()),
      usageTracking: Array.from(usageTracking.entries()),
      messages: Array.from(messages.entries()),
    };
    writeFileSync(dataPath, JSON.stringify(data), "utf-8");
  } catch (err) {
    console.warn("[db] Could not save data:", err);
  }
}

function loadData(): void {
  try {
    if (!existsSync(dataPath)) return;
    const raw = readFileSync(dataPath, "utf-8");
    const data = JSON.parse(raw) as Record<string, unknown>;
    nextId = (data.nextId as number) ?? 1;
    const load = <K, V>(src: unknown, map: Map<K, V>, keyFn: (k: unknown) => K) => {
      if (!Array.isArray(src)) return;
      for (const entry of src as [unknown, V][]) map.set(keyFn(entry[0]), entry[1]);
    };
    load(data.users, users, k => k as string);
    load(data.usersByEmail, usersByEmail, k => k as string);
    load(data.profiles, profiles, k => Number(k));
    load(data.scores, scores, k => Number(k));
    load(data.remindersStore, remindersStore, k => Number(k));
    load(data.consultations, consultations, k => Number(k));
    load(data.usageTracking, usageTracking, k => k as string);
    load(data.messages, messages, k => Number(k));
    console.log(`[db] Loaded ${users.size} users, ${usageTracking.size} usage records from ${dataPath}`);
  } catch (err) {
    console.warn("[db] Could not load data:", err);
  }
}

// Load persisted data on startup
loadData();

export function getDb() { return true; } // compatibility shim

export async function upsertUser(user: InsertUser): Promise<void> {
  const existing = users.get(user.openId);
  const ts = now();
  if (existing) {
    users.set(user.openId, { ...existing, ...user, updatedAt: ts });
  } else {
    const newUser: User = {
      id: idGen(), openId: user.openId, name: user.name ?? null,
      email: user.email ?? null, passwordHash: user.passwordHash ?? null,
      loginMethod: user.loginMethod ?? null, role: user.role ?? "user",
      createdAt: ts, updatedAt: ts, lastSignedIn: ts,
    };
    users.set(user.openId, newUser);
    if (newUser.email) usersByEmail.set(newUser.email, user.openId);
  }
  saveData();
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  return users.get(openId);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const openId = usersByEmail.get(email);
  return openId ? users.get(openId) : undefined;
}

/** username은 email 필드에 저장됨 — getUserByEmail의 시맨틱 별칭 */
export async function getUserByUsername(username: string): Promise<User | undefined> {
  return getUserByEmail(username);
}

export async function createLocalUser(insert: InsertUser & { passwordHash?: string | null }): Promise<User | undefined> {
  const ts = now();
  const newUser: User = {
    id: idGen(), openId: insert.openId, name: insert.name ?? null,
    email: insert.email ?? null, passwordHash: insert.passwordHash ?? null,
    loginMethod: insert.loginMethod ?? "local", role: (insert.role as "user" | "admin") ?? "user",
    createdAt: ts, updatedAt: ts, lastSignedIn: ts,
  };
  users.set(insert.openId, newUser);
  if (newUser.email) usersByEmail.set(newUser.email, insert.openId);
  saveData();
  return newUser;
}

export async function getUserProfile(userId: number): Promise<UserProfile | undefined> {
  return profiles.get(userId);
}

export async function upsertUserProfile(userId: number, profile: Omit<InsertUserProfile, 'userId'>): Promise<UserProfile | undefined> {
  const ts = now();
  const existing = profiles.get(userId);
  const updated: UserProfile = {
    id: existing?.id ?? idGen(), userId,
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
  saveData();
  return updated;
}

export async function getRelationshipScore(userId: number): Promise<RelationshipScore | undefined> {
  return scores.get(userId);
}

export async function upsertRelationshipScore(userId: number, score: number, factors?: Record<string, number> | Record<string, unknown>): Promise<RelationshipScore | undefined> {
  const ts = now();
  const existing = scores.get(userId);
  const updated: RelationshipScore = {
    id: existing?.id ?? idGen(), userId, score,
    factors: (factors as RelationshipScore["factors"]) ?? existing?.factors ?? null,
    lastUpdated: ts, createdAt: existing?.createdAt ?? ts,
  };
  scores.set(userId, updated);
  saveData();
  return updated;
}

export async function getUserReminders(userId: number): Promise<Reminder[]> {
  return remindersStore.get(userId) ?? [];
}

export async function createReminder(userId: number, reminder: Omit<InsertReminder, 'userId'>): Promise<void> {
  const ts = now();
  const list = remindersStore.get(userId) ?? [];
  list.push({
    id: idGen(), userId,
    title: reminder.title ?? "", type: reminder.type ?? "other",
    dueDate: reminder.dueDate ?? ts, description: reminder.description ?? null,
    completed: reminder.completed ?? false, createdAt: ts, updatedAt: ts,
  });
  remindersStore.set(userId, list);
  saveData();
}

export async function createAiConsultation(userId: number, consultation: Omit<InsertAiConsultation, 'userId'>): Promise<void> {
  const ts = now();
  const list = consultations.get(userId) ?? [];
  list.push({
    id: idGen(), userId,
    consultationType: consultation.consultationType ?? "other",
    userInput: consultation.userInput ?? "", aiResponse: consultation.aiResponse ?? "",
    metadata: consultation.metadata ?? null, createdAt: ts,
  });
  consultations.set(userId, list);
  saveData();
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
    id: existing?.id ?? idGen(), userId, usageDate,
    consultationCount: (existing?.consultationCount ?? 0) + 1,
    maxAllowed: existing?.maxAllowed ?? 3,
    tier: existing?.tier ?? "free",
    createdAt: existing?.createdAt ?? ts, updatedAt: ts,
  };
  usageTracking.set(key, updated);
  saveData();
  return updated;
}

export async function createRecommendedMessage(userId: number, message: Omit<InsertRecommendedMessage, 'userId'>): Promise<void> {
  const ts = now();
  const list = messages.get(userId) ?? [];
  list.push({
    id: idGen(), userId, consultationId: message.consultationId ?? null,
    message: message.message ?? "", context: message.context ?? null,
    category: message.category ?? null, copied: message.copied ?? false,
    used: message.used ?? false, createdAt: ts,
  });
  messages.set(userId, list);
  saveData();
}

export async function getUserRecommendedMessages(userId: number): Promise<RecommendedMessage[]> {
  return (messages.get(userId) ?? []).slice().reverse();
}

// Plain TypeScript types (no DB dependency)

export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  passwordHash: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
  lastSignedIn: string;
};

export type InsertUser = Partial<User> & { openId: string };

export type UserProfile = {
  id: number;
  userId: number;
  nickname: string;
  relationshipType: "dating" | "crush" | "longDistance" | "newlywed";
  partnerName: string;
  startDate: string | null;
  lastMetDate: string | null;
  lastConflictDate: string | null;
  contactFrequency: number | null;
  notes: string | null;
  onboardingCompleted: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type InsertUserProfile = Partial<UserProfile> & { userId: number; nickname: string; relationshipType: UserProfile["relationshipType"]; partnerName: string };

export type RelationshipScore = {
  id: number;
  userId: number;
  score: number | null;
  factors: { communicationQuality?: number; trustLevel?: number; conflictResolution?: number; emotionalConnection?: number } | null;
  lastUpdated: string;
  createdAt: string;
};

export type InsertRelationshipScore = Partial<RelationshipScore> & { userId: number };

export type Reminder = {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  type: "birthday" | "anniversary" | "actionPlan" | "other";
  dueDate: string;
  completed: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type InsertReminder = Partial<Reminder> & { userId: number; title: string; type: Reminder["type"]; dueDate: string };

export type AiConsultation = {
  id: number;
  userId: number;
  consultationType: "crisis" | "signalAnalysis" | "messageRecommendation" | "other";
  userInput: string;
  aiResponse: string;
  metadata: { positiveSignals?: number; negativeSignals?: number; probability?: number; recommendations?: string[] } | null;
  createdAt: string;
};

export type InsertAiConsultation = Partial<AiConsultation> & { userId: number; consultationType: AiConsultation["consultationType"]; userInput: string; aiResponse: string };

export type DailyUsageTracking = {
  id: number;
  userId: number;
  usageDate: string;
  consultationCount: number | null;
  maxAllowed: number | null;
  tier: "free" | "premium" | null;
  createdAt: string;
  updatedAt: string;
};

export type InsertDailyUsageTracking = Partial<DailyUsageTracking> & { userId: number; usageDate: string };

export type RecommendedMessage = {
  id: number;
  userId: number;
  consultationId: number | null;
  message: string;
  context: string | null;
  category: string | null;
  copied: boolean | null;
  used: boolean | null;
  createdAt: string;
};

export type InsertRecommendedMessage = Partial<RecommendedMessage> & { userId: number; message: string };

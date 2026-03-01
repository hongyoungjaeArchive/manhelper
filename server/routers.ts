import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { 
  getUserProfile, 
  upsertUserProfile, 
  getRelationshipScore, 
  upsertRelationshipScore,
  getUserReminders,
  createReminder,
  createAiConsultation,
  getUserAiConsultations,
  getDailyUsageTracking,
  incrementDailyUsage,
  createRecommendedMessage,
  getUserRecommendedMessages
} from "./db";
import { invokeKoreanLLM } from "./_core/llm";

// 공통 시스템 지시사항 - 모든 AI 기능에 적용
const KOREAN_ONLY = `[언어 규칙 - 절대 준수]
한국어만 쓰세요. 한자·중국어·일본어·영어 알파벳 단 한 글자도 금지입니다. 외래어는 한글로만 표기하세요.`;

const COUPLE_EXAMPLES = `[실제 한국 커플 대화 패턴 참고]
상황1 - 냉전: "왜 연락 안 해" → "바빴어" → "그게 말이야?" → 감정 폭발 → 며칠 후 슬그머니 연락
상황2 - 관심 감소: 처음엔 하루 100개 카톡 → 3개월 후 하루 5개 → 상대방이 먼저 불안 → 더 조르다 → 더 멀어짐
상황3 - 화해: 먼저 사과하면 70% 해결 → 단, "미안해 근데 너도~"는 역효과
상황4 - 썸 진행: 단순 친구 → 카카오톡 이모티콘 변화 → 야간 연락 증가 → 단둘이 만남 → 스킨십 허용`;

/** 과거 상담 이력을 AI 컨텍스트로 변환 — 반복 패턴을 파악해 개인화된 조언 제공 */
async function buildUserHistoryContext(userId: number): Promise<string> {
  const past = await getUserAiConsultations(userId, 10);
  if (past.length === 0) return "";

  // 유형별 빈도 집계
  const typeCounts: Record<string, number> = {};
  for (const c of past) {
    typeCounts[c.consultationType] = (typeCounts[c.consultationType] ?? 0) + 1;
  }

  // 최근 3개 요약 (userInput 앞 60자)
  const recentSummary = past
    .slice(0, 3)
    .map((c, i) => {
      const typeLabel: Record<string, string> = { crisis: "위기", signalAnalysis: "신호분석", chat: "채팅" };
      return `${i + 1}. [${typeLabel[c.consultationType] ?? c.consultationType}] ${(c.userInput ?? "").slice(0, 60)}`;
    })
    .join("\n");

  const freqNote = Object.entries(typeCounts)
    .map(([k, v]) => {
      const labels: Record<string, string> = { crisis: "위기 상담", signalAnalysis: "신호 분석", chat: "채팅" };
      return `${labels[k] ?? k} ${v}회`;
    })
    .join(", ");

  return `\n[이 사용자의 상담 이력 — 누적 ${past.length}회: ${freqNote}]
최근 상담:
${recentSummary}
→ 위 패턴을 바탕으로 이 사용자의 관계 상황을 파악하고 더 정확한 조언을 제공하세요.`;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // 사용자 프로필 관련 프로시저
  profile: router({
    // 사용자 프로필 조회
    get: protectedProcedure.query(async ({ ctx }) => {
      return await getUserProfile(ctx.user.id);
    }),

    // 사용자 프로필 생성 또는 업데이트
    upsert: protectedProcedure
      .input(z.object({
        nickname: z.string().min(1).max(100),
        relationshipType: z.enum(["dating", "crush", "longDistance", "newlywed"]),
        partnerName: z.string().min(1).max(100),
        startDate: z.date().optional(),
        lastMetDate: z.date().optional(),
        lastConflictDate: z.date().optional(),
        contactFrequency: z.number().int().min(0).max(100).optional(),
        notes: z.string().optional(),
        onboardingCompleted: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await upsertUserProfile(ctx.user.id, input);
      }),
  }),

  // 관계 점수 관련 프로시저
  relationshipScore: router({
    // 관계 점수 조회
    get: protectedProcedure.query(async ({ ctx }) => {
      return await getRelationshipScore(ctx.user.id);
    }),

    // 관계 점수 업데이트
    update: protectedProcedure
      .input(z.object({
        score: z.number().int().min(0).max(100),
        factors: z.record(z.string(), z.number()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await upsertRelationshipScore(ctx.user.id, input.score, input.factors);
      }),
  }),

  // 리마인더 관련 프로시저
  reminders: router({
    // 리마인더 목록 조회
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserReminders(ctx.user.id);
    }),

    // 리마인더 생성
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        type: z.enum(["birthday", "anniversary", "actionPlan", "other"]),
        dueDate: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await createReminder(ctx.user.id, input);
      }),
  }),

  // AI 상담 관련 프로시저
  aiConsultation: router({
    // 사용 횟수 확인 및 제한 체크
    checkUsageLimit: protectedProcedure.query(async ({ ctx }) => {
      const today = new Date().toISOString().split('T')[0];
      const usage = await getDailyUsageTracking(ctx.user.id, today);
      
      if (!usage) {
        return {
          canUse: true,
          used: 0,
          limit: 3,
          remaining: 3,
        };
      }

      const usedCount = usage.consultationCount ?? 0;
      const maxCount = usage.maxAllowed ?? 3;
      const canUse = usedCount < maxCount;
      return {
        canUse,
        used: usedCount,
        limit: maxCount,
        remaining: Math.max(0, maxCount - usedCount),
      };
    }),

    // 위기 대응 분석
    crisis: protectedProcedure
      .input(z.object({
        situation: z.string().min(10).max(500),
      }))
      .mutation(async ({ ctx, input }) => {
        // 사용 횟수 확인
        const today = new Date().toISOString().split('T')[0];
        const usage = await getDailyUsageTracking(ctx.user.id, today);
        
        const usedCount = usage?.consultationCount ?? 0;
        const maxCount = usage?.maxAllowed ?? 3;
        if (usedCount >= maxCount) {
          throw new Error("일일 사용 횟수를 초과했습니다.");
        }

        // 사용자 프로필 + 상담 이력 병렬 조회
        const [profile, historyContext] = await Promise.all([
          getUserProfile(ctx.user.id),
          buildUserHistoryContext(ctx.user.id),
        ]);

        const relationshipLabel: Record<string, string> = {
          dating: "연인 관계", crush: "썸 타는 관계", longDistance: "장거리 연애", newlywed: "신혼 부부"
        };
        const relLabel = profile?.relationshipType ? (relationshipLabel[profile.relationshipType] || profile.relationshipType) : "연인";
        const partnerRef = profile?.partnerName ? `상대방(${profile.partnerName})` : "상대방";

        const prompt = `관계: ${relLabel} / 연락 빈도 주${profile?.contactFrequency || 7}회

상황:
${input.situation}

아래 형식으로 짧고 핵심만 답하세요:

🔴 핵심 진단
(무슨 문제인지 2줄 이내로)

⚡ 지금 할 행동
1. (구체적 행동 - 오늘 안에 할 것)
2. (구체적 행동)

❌ 절대 하지 말 것
(딱 한 가지)

💬 지금 보낼 메시지
(따옴표 없이 메시지 본문만, 20자 내외)`;

        const aiResponse = await invokeKoreanLLM({
          messages: [
            {
              role: "system",
              content: `남성 연애 상담 전문가입니다. 남자들이 읽기 좋게 짧고 직접적으로 답합니다.
${KOREAN_ONLY}
${COUPLE_EXAMPLES}${historyContext}
답변은 반드시 300자 이내로 유지하세요. 서론 없이 바로 핵심을 말하세요.`
            },
            { role: "user", content: prompt },
          ],
        });

        // AI 상담 이력 저장
        await createAiConsultation(ctx.user.id, {
          consultationType: "crisis",
          userInput: input.situation,
          aiResponse,
        });

        // 사용 횟수 증가
        await incrementDailyUsage(ctx.user.id, today);

        return {
          analysis: aiResponse,
          timestamp: new Date(),
        };
      }),

    // 썸 신호 분석
    signalAnalysis: protectedProcedure
      .input(z.object({
        positiveSignals: z.array(z.string()),
        negativeSignals: z.array(z.string()),
      }))
      .mutation(async ({ ctx, input }) => {
        // 사용 횟수 확인
        const today = new Date().toISOString().split('T')[0];
        const usage = await getDailyUsageTracking(ctx.user.id, today);
        
        const usedCount = usage?.consultationCount ?? 0;
        const maxCount = usage?.maxAllowed ?? 3;
        if (usedCount >= maxCount) {
          throw new Error("일일 사용 횟수를 초과했습니다.");
        }

        const positiveCount = input.positiveSignals.length;
        const negativeCount = input.negativeSignals.length;
        const total = positiveCount + negativeCount;
        
        let probability = 50;
        if (total > 0) {
          probability = Math.round((positiveCount / total) * 100);
        }

        // LLM을 통한 신호 분석
        const prompt = `긍정 신호 ${positiveCount}개: ${input.positiveSignals.filter(s => !s.startsWith('[현재')).join(', ') || '없음'}
부정 신호 ${negativeCount}개: ${input.negativeSignals.join(', ') || '없음'}
${input.positiveSignals.find(s => s.startsWith('[현재')) || ''}

아래 형식으로 짧고 핵심만 답하세요:

📊 판단
(호감도 ${probability}% — 실제로 뭘 의미하는지 2줄)

🔍 핵심 신호 해석
(가장 중요한 신호 2개만 한 줄씩)

👉 지금 할 행동
1. (오늘 시도할 것)
2. (다음 주 안에 할 것)

⚠️ 착각 주의
(딱 한 줄)`;

        const historyCtx = await buildUserHistoryContext(ctx.user.id);
        const analysis = await invokeKoreanLLM({
          messages: [
            {
              role: "system",
              content: `남성 연애 신호 분석 전문가입니다. 팩트 중심으로 짧고 직접적으로 분석합니다.
${KOREAN_ONLY}
${COUPLE_EXAMPLES}${historyCtx}
답변은 반드시 300자 이내로 유지하세요. 서론 없이 바로 분석하세요.`
            },
            { role: "user", content: prompt },
          ],
        });

        // AI 상담 이력 저장
        await createAiConsultation(ctx.user.id, {
          consultationType: "signalAnalysis",
          userInput: `긍정: ${input.positiveSignals.join(", ")} / 부정: ${input.negativeSignals.join(", ")}`,
          aiResponse: analysis,
          metadata: {
            positiveSignals: positiveCount,
            negativeSignals: negativeCount,
            probability,
          },
        });

        // 사용 횟수 증가
        await incrementDailyUsage(ctx.user.id, today);

        return {
          probability,
          analysis,
          positiveCount,
          negativeCount,
          timestamp: new Date(),
        };
      }),

    // 그녀의 메시지 해독
    herMessage: protectedProcedure
      .input(z.object({
        herMessage: z.string().min(1).max(500),
        context: z.string().max(200).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const today = new Date().toISOString().split('T')[0];
        const usage = await getDailyUsageTracking(ctx.user.id, today);
        const usedCount = usage?.consultationCount ?? 0;
        const maxCount = usage?.maxAllowed ?? 3;
        if (usedCount >= maxCount) throw new Error("일일 사용 횟수를 초과했습니다.");

        const profile = await getUserProfile(ctx.user.id);
        const partnerRef = profile?.partnerName ? `${profile.partnerName}` : "그녀";

        const prompt = `${partnerRef}의 메시지: "${input.herMessage}"
${input.context ? `[상황] ${input.context}` : ""}

아래 형식으로 짧고 핵심만 답하세요:

💭 진짜 의도
(실제로 무슨 말인지 — 1~2줄)

😤 지금 감정 상태
(어떤 감정인지 — 1줄)

💬 추천 답장
(그대로 보내도 되는 카카오톡 메시지 본문만, 20~40자)

⚠️ 주의
(딱 한 줄)`;

        const analysis = await invokeKoreanLLM({
          messages: [
            {
              role: "system",
              content: `여자친구/썸녀의 메시지를 해석하는 전문가입니다. 남자 입장에서 여자의 심리를 짧고 명확하게 분석합니다.
${KOREAN_ONLY}
${COUPLE_EXAMPLES}
핵심만 간결하게. 서론 없이 바로 분석.`,
            },
            { role: "user", content: prompt },
          ],
        });

        await createAiConsultation(ctx.user.id, {
          consultationType: "herMessage",
          userInput: input.herMessage,
          aiResponse: analysis,
        });
        await incrementDailyUsage(ctx.user.id, today);

        return { analysis, timestamp: new Date() };
      }),

    // AI 상담 이력 조회
    history: protectedProcedure.query(async ({ ctx }) => {
      return await getUserAiConsultations(ctx.user.id, 20);
    }),

    // 자유 채팅
    chat: protectedProcedure
      .input(z.object({
        message: z.string().min(1).max(1000),
        history: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // 사용자 프로필 조회
        const profile = await getUserProfile(ctx.user.id);

        const chatRelMap: Record<string, string> = {
          dating: "연인 관계", crush: "썸 타는 관계", longDistance: "장거리 연애 중", newlywed: "신혼 부부",
        };
        const chatRelType = profile?.relationshipType ? (chatRelMap[profile.relationshipType] || profile.relationshipType) : null;
        const partnerName = profile?.partnerName || null;

        const chatHistoryCtx = await buildUserHistoryContext(ctx.user.id);

        const profileCtx = profile
          ? ` 사용자는 현재 ${partnerName ? `'${partnerName}'와(과)` : '상대방과'} ${chatRelType || '연인'} 관계입니다.`
          : '';

        const systemPrompt = `당신은 남성 전용 연애 AI 상담사입니다.${profileCtx}
${KOREAN_ONLY}
${COUPLE_EXAMPLES}${chatHistoryCtx}

[상담사 역할 지침]
- 사용자의 연애 고민을 경청하고 심리학적으로 분석한다
- 반드시 공감 → 상황 분석 → 구체적 행동 제안 순서로 답한다
- 처음 대화(인사만 할 때)에서는 어떤 고민이 있는지 한 문장으로 물어본다
- 친근한 존댓말 사용 (예: "그렇군요", "힘드셨겠어요", "이렇게 해보시는 게 좋을 것 같아요")
- 200자 이내, 서론·마무리 인사 없이 바로 핵심

[절대 금지]
- 상대방(여자친구·썸녀) 역할 연기 금지
- 사용자를 이미 아는 것처럼 개인적으로 묻는 것 금지 (예: "왜 연락 안 했어?" 같은 말 절대 금지)
- 반말 금지`;

        const chatMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: systemPrompt },
          ...(input.history || []).map(h => ({ role: h.role, content: h.content })),
          { role: "user", content: input.message },
        ];

        const aiResponse = await invokeKoreanLLM({ messages: chatMessages });

        return {
          message: aiResponse,
          timestamp: new Date(),
        };
      }),
  }),

  // 추천 메시지 관련 프로시저
  messages: router({
    // 추천 메시지 목록
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserRecommendedMessages(ctx.user.id);
    }),

    // 메시지 생성 (AI 기반)
    generate: protectedProcedure
      .input(z.object({
        context: z.string().min(10).max(300),
        category: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // 사용 횟수 확인
        const today = new Date().toISOString().split('T')[0];
        const usage = await getDailyUsageTracking(ctx.user.id, today);
        
        const usedCount = usage?.consultationCount ?? 0;
        const maxCount = usage?.maxAllowed ?? 3;
        if (usedCount >= maxCount) {
          throw new Error("일일 사용 횟수를 초과했습니다.");
        }

        // LLM을 통한 메시지 생성
        const prompt = `${input.context}

카카오톡 메시지 한 개만 출력하세요. 설명·따옴표·이모지 없이 메시지 본문만.`;

        const message = await invokeKoreanLLM({
          messages: [
            {
              role: "system",
              content: `한국 남성이 연인에게 보내는 카카오톡 메시지를 작성합니다.
${KOREAN_ONLY}
조건: 진짜 사람이 보낸 것처럼 자연스럽게, 20~40자 이내, 본문만 출력.`
            },
            { role: "user", content: prompt },
          ],
        });

        // 메시지 저장
        await createRecommendedMessage(ctx.user.id, {
          message,
          context: input.context,
          category: input.category,
        });

        // 사용 횟수 증가
        await incrementDailyUsage(ctx.user.id, today);

        return {
          message,
          timestamp: new Date(),
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;

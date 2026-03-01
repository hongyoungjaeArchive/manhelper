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
import { invokeLLM } from "./_core/llm";

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

        // 사용자 프로필 조회
        const profile = await getUserProfile(ctx.user.id);
        
        // LLM을 통한 AI 분석
        const prompt = `당신은 연애 전략 AI 의사결정 엔진입니다. 사용자의 연애 상황을 분석하고 즉각적인 전략을 제공합니다.

사용자 정보:
- 관계 유형: ${profile?.relationshipType || '미정'}
- 상대방: ${profile?.partnerName || '미정'}
- 연락 빈도: 주당 ${profile?.contactFrequency || 7}회

사용자의 상황:
${input.situation}

위 상황에 대해 다음을 제공해주세요:
1. 상황 분석 (2-3줄)
2. 즉각적인 행동 전략 (3-4개 항목)
3. 주의사항 (1-2줄)
4. 추천 메시지 (1개, 실제 사용 가능한 메시지)`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "당신은 연애 전략 AI 의사결정 엔진입니다. 사용자의 연애 상황을 분석하고 즉각적인 전략을 제공합니다." },
            { role: "user", content: prompt },
          ],
        });

        const responseContent = response.choices[0]?.message.content;
        const aiResponse = typeof responseContent === 'string' ? responseContent : "분석 결과를 생성할 수 없습니다.";

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
        const prompt = `당신은 연애 신호 분석 전문가입니다. 사용자가 제시한 신호들을 분석하여 상대방의 호감도를 평가합니다.

긍정 신호 (${positiveCount}개):
${input.positiveSignals.map((s, i) => `${i + 1}. ${s}`).join('\n')}

부정 신호 (${negativeCount}개):
${input.negativeSignals.map((s, i) => `${i + 1}. ${s}`).join('\n')}

위 신호들을 분석하여:
1. 호감도 평가 (${probability}%)
2. 신호 해석 (각 신호의 의미)
3. 추천 행동 (다음 단계)`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "당신은 연애 신호 분석 전문가입니다." },
            { role: "user", content: prompt },
          ],
        });

        const responseContent = response.choices[0]?.message.content;
        const analysis = typeof responseContent === 'string' ? responseContent : "분석 결과를 생성할 수 없습니다.";

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

        const systemPrompt = `당신은 연애 AI 상담사입니다. 사용자의 연애 고민을 들어주고 따뜻하고 실용적인 조언을 제공합니다.${profile ? `\n\n사용자 정보:\n- 관계 유형: ${profile.relationshipType || '미정'}\n- 상대방: ${profile.partnerName || '미정'}` : ''}`;

        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: systemPrompt },
          ...(input.history || []).map(h => ({ role: h.role, content: h.content })),
          { role: "user", content: input.message },
        ];

        const response = await invokeLLM({ messages });

        const responseContent = response.choices[0]?.message.content;
        const aiResponse = typeof responseContent === 'string' ? responseContent : "응답을 생성할 수 없습니다.";

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
        const prompt = `당신은 연애 메시지 작성 전문가입니다. 자연스럽고 진심 어린 메시지를 작성합니다.

상황: ${input.context}
카테고리: ${input.category || '일반'}

위 상황에 맞는 자연스러운 메시지를 1-2줄로 작성해주세요.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "당신은 연애 메시지 작성 전문가입니다." },
            { role: "user", content: prompt },
          ],
        });

        const responseContent = response.choices[0]?.message.content;
        const message = typeof responseContent === 'string' ? responseContent : "메시지를 생성할 수 없습니다.";

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

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
        const prompt = `사용자 정보:
- 관계 유형: ${profile?.relationshipType || '미정'}
- 상대방 이름: ${profile?.partnerName || '미정'}
- 연락 빈도: 주당 ${profile?.contactFrequency || 7}회

현재 상황:
${input.situation}

위 상황에 대해 아래 형식으로 답변해 주세요:

**📊 상황 분석**
(상황을 2~3문장으로 따뜻하게 공감하며 분석)

**💡 즉각적인 행동 전략**
1. (구체적인 행동 제안)
2. (구체적인 행동 제안)
3. (구체적인 행동 제안)

**⚠️ 주의사항**
(꼭 피해야 할 행동 1~2가지)

**💬 추천 메시지**
"(바로 사용할 수 있는 자연스러운 한국어 문자 메시지)"`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "당신은 연애 심리 전문가이자 따뜻한 상담사입니다. 항상 자연스럽고 유창한 한국어로 답변하세요. 공감을 먼저 표현하고, 현실적이고 구체적인 조언을 제공하세요. 절대 어색한 직역체나 번역투를 사용하지 마세요." },
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
        const prompt = `긍정적인 신호 (${positiveCount}개):
${input.positiveSignals.map((s, i) => `${i + 1}. ${s}`).join('\n') || '없음'}

부정적인 신호 (${negativeCount}개):
${input.negativeSignals.map((s, i) => `${i + 1}. ${s}`).join('\n') || '없음'}

계산된 호감도 수치: ${probability}%

아래 형식으로 분석해 주세요:

**❤️ 호감도 평가: ${probability}%**
(전체적인 상황을 2~3문장으로 솔직하게 평가)

**🔍 신호 해석**
(각 신호가 실제로 어떤 심리를 나타내는지 구체적으로 설명)

**👣 다음 단계 추천**
1. (지금 당장 해볼 수 있는 행동)
2. (중기적으로 관계를 발전시킬 방법)
3. (주의해야 할 점)`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "당신은 연애 심리와 비언어적 신호 해석에 정통한 전문가입니다. 항상 자연스럽고 유창한 한국어로 답변하세요. 솔직하되 배려 있게, 현실적이고 실용적인 조언을 제공하세요. 어색한 번역투나 딱딱한 표현은 절대 사용하지 마세요." },
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

        const relationshipMap: Record<string, string> = {
          dating: "연인",
          crush: "썸",
          longDistance: "장거리 연애",
          newlywed: "신혼",
        };
        const relType = profile?.relationshipType ? (relationshipMap[profile.relationshipType] || profile.relationshipType) : null;
        const systemPrompt = `당신은 연애 심리 전문가이자 따뜻한 AI 상담사입니다.${profile ? `\n\n[사용자 상황]\n- 관계: ${relType || '미정'}${profile.partnerName ? `\n- 상대방 이름: ${profile.partnerName}` : ''}` : ''}

답변 시 지켜야 할 원칙:
- 항상 자연스럽고 유창한 한국어로 대화하듯 답변하세요
- 먼저 공감을 표현한 뒤 조언을 제공하세요
- 구체적이고 바로 실천할 수 있는 조언을 주세요
- 너무 길지 않게, 핵심만 간결하게 말하세요
- 딱딱하거나 번역투 같은 표현은 절대 사용하지 마세요
- 상대방 이름이 있으면 자연스럽게 활용하세요`;

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
        const prompt = `상황: ${input.context}
카테고리: ${input.category || '일반'}

위 상황에 딱 맞는 자연스러운 문자 메시지를 작성해 주세요.
- 실제로 한국 사람이 연인이나 좋아하는 사람에게 보낼 법한 톤으로
- 너무 길지 않게 1~2문장으로
- 따옴표 없이 메시지 본문만 출력`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "당신은 연애 메시지 작성 전문가입니다. 한국인이 실제로 쓰는 자연스러운 문어체/구어체를 구분하여 상황에 맞는 메시지를 작성합니다. 절대 번역투나 어색한 표현을 쓰지 마세요." },
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

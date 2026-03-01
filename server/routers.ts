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
        const relationshipLabel: Record<string, string> = {
          dating: "연인 관계", crush: "썸 타는 관계", longDistance: "장거리 연애", newlywed: "신혼 부부"
        };
        const relLabel = profile?.relationshipType ? (relationshipLabel[profile.relationshipType] || profile.relationshipType) : "연인";
        const partnerRef = profile?.partnerName ? `상대방(${profile.partnerName})` : "상대방";

        const prompt = `[상담 요청자 상황]
- 관계: ${relLabel}
- ${partnerRef}과의 연락 빈도: 주당 ${profile?.contactFrequency || 7}회

[현재 위기 상황]
${input.situation}

위 상황을 아래 형식으로 전문적으로 분석해 주세요:

**💬 공감 및 감정 인정**
(지금 느끼는 감정이 당연하다는 것을 따뜻하게 인정하고 공감해 주세요. "이런 상황에서 그런 감정을 느끼는 건 아주 자연스러운 반응이에요"처럼)

**🔍 심리적 분석**
(${partnerRef}의 행동에 숨겨진 심리적 원인을 애착 이론, 의사소통 패턴, 감정 조절 관점에서 설명해 주세요. 상대를 나쁜 사람으로 단정 짓지 말고 이해의 틀을 제공해 주세요)

**💡 지금 당장 실천할 수 있는 행동**
1. (심리적 근거가 있는 구체적 행동)
2. (심리적 근거가 있는 구체적 행동)
3. (심리적 근거가 있는 구체적 행동)

**⚠️ 절대 하지 말아야 할 것**
(충동적으로 하기 쉽지만 관계를 악화시키는 행동과 그 이유)

**💌 추천 메시지**
"(지금 ${partnerRef}에게 바로 보낼 수 있는 진심 어린 한국어 문자)"`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `당신은 대한민국 최고의 정신건강의학과 전문의이자 연애 심리 상담사입니다. 오은영 박사처럼 따뜻하고 전문적인 방식으로 상담합니다.

[언어 규칙 - 절대 준수]
오직 자연스러운 한국어만 사용하세요. 한자, 중국어, 일본어, 영어 알파벳을 단 한 글자도 쓰지 마세요.

[상담 철학]
- 감정을 먼저 인정하고 공감합니다 ("그런 감정이 드는 게 당연해요", "많이 힘드셨겠다")
- 상대방의 행동을 심리학적으로 설명합니다 (애착 유형, 방어기제, 의사소통 방식)
- 문제의 원인을 한쪽에 귀책하지 않고 관계 역학으로 바라봅니다
- 즉각적 행동보다 감정 조절과 건강한 소통 방법을 우선합니다
- 한국 문화적 맥락(눈치, 체면, 가족 영향)을 이해하고 반영합니다
- 구체적이고 실천 가능한 조언을 제공합니다`
            },
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
        const prompt = `[상대방의 행동 신호 분석 요청]

긍정적인 신호 (${positiveCount}개):
${input.positiveSignals.map((s, i) => `${i + 1}. ${s}`).join('\n') || '없음'}

부정적인 신호 (${negativeCount}개):
${input.negativeSignals.map((s, i) => `${i + 1}. ${s}`).join('\n') || '없음'}

아래 형식으로 전문적으로 분석해 주세요:

**❤️ 종합 호감도: ${probability}%**
(단순 수치가 아닌, 신호들이 전체적으로 어떤 관계 단계를 나타내는지 심리학적으로 해석)

**🧠 신호별 심리 분석**
(각 긍정 신호와 부정 신호가 상대방의 어떤 심리 상태를 반영하는지 설명. 예를 들어 "자주 연락하는 것은 단순한 습관일 수도 있지만, 특정 상황에서만 연락한다면..." 처럼 맥락을 고려해 설명)

**💡 관계 발전 전략**
1. (지금 바로 시도할 수 있는 심리적으로 효과적인 행동)
2. (상대방의 감정을 안전하게 확인하는 방법)
3. (관계 진전을 위한 중기 전략)

**⚠️ 오해하기 쉬운 착각**
(이 신호들을 잘못 해석해서 오버하거나 실망하기 쉬운 부분 경고)`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `당신은 비언어적 신호와 관계 심리학 전문가입니다. 오은영 박사처럼 따뜻하고 전문적으로 분석합니다.

[언어 규칙 - 절대 준수]
오직 자연스러운 한국어만 사용하세요. 한자, 중국어, 일본어, 영어 알파벳을 단 한 글자도 쓰지 마세요.

[분석 철학]
- 행동 신호는 맥락에 따라 의미가 다름을 강조하세요
- 지나친 확신("이건 분명히 좋아하는 거야")보다 가능성으로 표현하세요
- 애착 유형(불안형, 회피형, 안정형)의 관점에서 행동을 해석하세요
- 한국 연애 문화(밀당, 눈치, 직접 표현을 꺼리는 경향)를 반영하세요
- 상대방의 의도를 속단하지 말고 다양한 해석 가능성을 제시하세요`
            },
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

        const chatRelMap: Record<string, string> = {
          dating: "연인 관계", crush: "썸 타는 관계", longDistance: "장거리 연애 중", newlywed: "신혼 부부",
        };
        const chatRelType = profile?.relationshipType ? (chatRelMap[profile.relationshipType] || profile.relationshipType) : null;
        const partnerName = profile?.partnerName || null;

        const systemPrompt = `당신은 대한민국 최고의 연애 심리 상담사입니다. 오은영 박사의 상담 스타일처럼 따뜻하고 전문적으로 대화합니다.
${profile ? `\n[내담자 상황]\n- 현재 관계: ${chatRelType || '미정'}${partnerName ? `\n- 상대방 이름: ${partnerName}` : ''}` : ''}

[절대 언어 규칙]
반드시 자연스러운 한국어만 사용하세요. 한자, 중국어, 일본어, 영어 알파벳을 단 한 글자도 쓰지 마세요. 외래어는 한글로 표기하세요(예: 스트레스, 커플, 메시지, 패턴).

[상담 스타일]
- 먼저 상대방의 감정을 충분히 인정하고 공감하세요. ("그 상황에서 그런 감정이 드는 건 당연한 거예요", "많이 힘드셨겠다" 등)
- 심리학적 관점에서 상황을 해석해 주세요. 애착 이론, 방어기제, 의사소통 패턴, 감정 조절 방식을 자연스럽게 활용하세요.
- 상대방의 행동을 단순히 나쁘다/좋다로 판단하지 말고, 그 사람이 왜 그런 행동을 하는지 심리적 이유를 설명해 주세요.
- 한국 연애 문화(밀당, 눈치, 직접적 표현을 꺼리는 경향, 가족 관계의 영향)를 자연스럽게 반영하세요.
- 충동적인 행동보다 감정을 먼저 정리하고 건강한 소통을 하도록 안내하세요.
- 너무 길게 설명하지 말고 핵심을 짚어 주되, 필요하면 추가 질문을 던져 대화를 이어가세요.
- 상대방 이름이 있으면 자연스럽게 활용하세요.
- 마치 오래된 친구이자 전문가인 것처럼 편안하고 따뜻하게 대화하세요.`;

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
        const prompt = `[메시지 작성 요청]
상황: ${input.context}
카테고리: ${input.category || '일반'}

심리적으로 효과적이면서 자연스러운 한국어 메시지를 작성해 주세요.

조건:
- 한국 20~30대가 카카오톡으로 보낼 법한 자연스러운 톤
- 진심이 느껴지면서도 부담스럽지 않게
- 1~2문장 이내로 간결하게
- 메시지 본문만 출력 (설명, 따옴표, 이모지 없이)`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `당신은 연애 심리를 이해하는 메시지 작성 전문가입니다. 오은영 박사처럼 상대방의 심리를 고려한 효과적인 소통 방식으로 메시지를 작성합니다.

[절대 규칙] 오직 순수한 한국어만 사용하세요. 한자, 영어 알파벳, 일본어를 단 한 글자도 쓰지 마세요.

좋은 메시지의 조건:
- 방어적이지 않고 감정을 솔직하게 표현
- 상대방이 편안하게 받아들일 수 있는 부드러운 어조
- 과하지 않고 진심이 느껴지는 자연스러운 표현
- 한국 연애 문화에 맞는 적절한 거리감`
            },
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

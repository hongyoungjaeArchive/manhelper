import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const RELATIONSHIP_STAGE = [
  { id: "stranger", label: "지인 / 아는 사이" },
  { id: "friend", label: "친구" },
  { id: "close", label: "친한 친구" },
  { id: "crush", label: "썸 타는 중" },
  { id: "dating", label: "연인" },
];

const KNOWN_DURATION = [
  { id: "under1m", label: "1개월 미만" },
  { id: "1to3m", label: "1~3개월" },
  { id: "3to6m", label: "3~6개월" },
  { id: "over6m", label: "6개월 이상" },
];

const SIGNAL_CATEGORIES = [
  {
    label: "📱 연락 패턴",
    positive: [
      "먼저 연락을 자주 한다",
      "답장이 빠르다",
      "카카오톡 프사/상태메시지가 나와 관련 있다",
      "늦은 시간에도 연락한다",
    ],
    negative: [
      "연락이 점점 줄어들었다",
      "답장이 느리거나 짧다",
      "읽씹이 잦아졌다",
    ],
  },
  {
    label: "🤝 만남 태도",
    positive: [
      "자주 만나자고 제안한다",
      "만날 때 시간을 오래 보내려 한다",
      "헤어질 때 아쉬워한다",
      "단둘이 만나는 것을 편안해한다",
    ],
    negative: [
      "만남 약속을 자주 취소한다",
      "만날 때 어색하거나 거리감이 있다",
      "단둘이 만나는 것을 피하는 것 같다",
    ],
  },
  {
    label: "💬 말투 / 표현",
    positive: [
      "내 이야기를 잘 기억하고 언급한다",
      "칭찬과 관심 표현을 자주 한다",
      "장난이나 놀림이 많아졌다",
      "미래 계획에 나를 포함한다",
    ],
    negative: [
      "대화가 건조하고 사무적이다",
      "내 말에 공감을 잘 안 한다",
      "다른 이성 이야기를 자연스럽게 꺼낸다",
    ],
  },
  {
    label: "🙋 행동 / 신체 언어",
    positive: [
      "신체 접촉을 자연스럽게 한다",
      "내 주변을 자주 맴돈다",
      "나를 볼 때 자주 웃는다",
      "내 친구들과 잘 어울리려 한다",
    ],
    negative: [
      "예전보다 신체 접촉이 줄었다",
      "눈 맞춤을 피한다",
      "만날 때 휴대폰만 본다",
    ],
  },
  {
    label: "❤️ 관심 / 배려",
    positive: [
      "내 생일, 기념일을 기억한다",
      "내가 좋아하는 것을 기억해서 챙긴다",
      "내가 힘들 때 먼저 걱정해준다",
      "SNS에서 내 게시물에 반응이 빠르다",
    ],
    negative: [
      "예전에는 챙겨줬는데 요즘은 아니다",
      "내 일에 관심이 없어 보인다",
      "SNS에서 반응이 없어졌다",
    ],
  },
];

function Chip({ label, selected, color, onClick }: {
  label: string; selected: boolean; color: "green" | "red"; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm border text-left transition ${
        selected
          ? color === "green"
            ? "bg-green-500/20 border-green-500 text-white"
            : "bg-red-500/20 border-red-500 text-white"
          : "bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500"
      }`}
    >
      {label}
    </button>
  );
}

function StageChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm border transition ${
        selected ? "bg-pink-500 border-pink-500 text-white" : "bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-400"
      }`}
    >
      {label}
    </button>
  );
}

export default function SignalAnalysis() {
  const [, setLocation] = useLocation();
  const [stage, setStage] = useState("");
  const [duration, setDuration] = useState("");
  const [selectedPositive, setSelectedPositive] = useState<string[]>([]);
  const [selectedNegative, setSelectedNegative] = useState<string[]>([]);
  const [additionalContext, setAdditionalContext] = useState("");
  const [result, setResult] = useState<any>(null);

  const { data: usageLimit, refetch: refetchUsage } = trpc.aiConsultation.checkUsageLimit.useQuery();
  const analysisMutation = trpc.aiConsultation.signalAnalysis.useMutation();

  const togglePositive = (s: string) =>
    setSelectedPositive(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const toggleNegative = (s: string) =>
    setSelectedNegative(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const handleAnalyze = async () => {
    if (!stage) { toast.error("현재 관계 단계를 선택해주세요"); return; }
    if (!duration) { toast.error("알고 지낸 기간을 선택해주세요"); return; }
    if (selectedPositive.length === 0 && selectedNegative.length === 0) {
      toast.error("신호를 하나 이상 선택해주세요"); return;
    }

    const stageLabel = RELATIONSHIP_STAGE.find(s => s.id === stage)?.label || "";
    const durationLabel = KNOWN_DURATION.find(d => d.id === duration)?.label || "";

    const enrichedPositive = selectedPositive.map(s =>
      additionalContext ? s : s
    );

    const contextNote = additionalContext
      ? `\n[추가 상황]\n${additionalContext}\n`
      : "";

    const enrichedNegative = selectedNegative;

    const positiveWithContext = [
      `[현재 관계: ${stageLabel} / 알고 지낸 기간: ${durationLabel}]${contextNote}`,
      ...enrichedPositive,
    ];

    try {
      const response = await analysisMutation.mutateAsync({
        positiveSignals: positiveWithContext,
        negativeSignals: enrichedNegative,
      });
      setResult(response);
      refetchUsage();
      toast.success("분석이 완료되었습니다!");
    } catch (error: any) {
      toast.error(error.message || "분석 중 오류가 발생했습니다");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => setLocation("/dashboard")} className="text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-white">썸 신호 분석</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {usageLimit && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-300 text-sm">
              오늘 남은 상담 횟수: <span className="font-bold text-red-500">{usageLimit.remaining}</span> / {usageLimit.limit}회
            </p>
          </div>
        )}

        {!result ? (
          <>
            {/* 1. 관계 단계 */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-base font-bold text-white mb-1">1. 현재 어떤 관계인가요?</h2>
              <p className="text-slate-400 text-sm mb-4">상대방과의 현재 관계 단계를 선택하세요</p>
              <div className="flex flex-wrap gap-2">
                {RELATIONSHIP_STAGE.map(s => (
                  <StageChip key={s.id} label={s.label} selected={stage === s.id} onClick={() => setStage(s.id)} />
                ))}
              </div>
            </div>

            {/* 2. 알고 지낸 기간 */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-base font-bold text-white mb-1">2. 얼마나 알고 지냈나요?</h2>
              <p className="text-slate-400 text-sm mb-4">처음 만난 시점 기준으로 선택하세요</p>
              <div className="flex flex-wrap gap-2">
                {KNOWN_DURATION.map(d => (
                  <StageChip key={d.id} label={d.label} selected={duration === d.id} onClick={() => setDuration(d.id)} />
                ))}
              </div>
            </div>

            {/* 3. 신호 선택 */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-base font-bold text-white mb-1">3. 상대방의 신호를 선택해주세요</h2>
              <p className="text-slate-400 text-sm mb-5">해당되는 신호를 모두 선택하세요. 녹색은 긍정, 빨간색은 부정 신호예요.</p>

              <div className="space-y-6">
                {SIGNAL_CATEGORIES.map(cat => (
                  <div key={cat.label}>
                    <p className="text-slate-300 text-sm font-semibold mb-3">{cat.label}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {cat.positive.map(s => (
                        <Chip key={s} label={s} color="green" selected={selectedPositive.includes(s)} onClick={() => togglePositive(s)} />
                      ))}
                      {cat.negative.map(s => (
                        <Chip key={s} label={s} color="red" selected={selectedNegative.includes(s)} onClick={() => toggleNegative(s)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-4 text-sm text-slate-400">
                <span>✅ 긍정 신호 <strong className="text-green-400">{selectedPositive.length}개</strong> 선택됨</span>
                <span>❌ 부정 신호 <strong className="text-red-400">{selectedNegative.length}개</strong> 선택됨</span>
              </div>
            </div>

            {/* 4. 추가 상황 */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-base font-bold text-white mb-1">4. 추가로 설명할 상황이 있나요? <span className="text-slate-400 font-normal">(선택)</span></h2>
              <p className="text-slate-400 text-sm mb-4">최근 있었던 특별한 사건이나 변화가 있다면 적어주세요</p>
              <textarea
                value={additionalContext}
                onChange={e => setAdditionalContext(e.target.value.slice(0, 300))}
                placeholder="예: 최근에 같이 여행을 다녀왔는데 그 이후로 느낌이 달라진 것 같아요..."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 h-24 resize-none"
              />
              <p className="text-slate-400 text-sm mt-1 text-right">{additionalContext.length} / 300자</p>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={analysisMutation.isPending || !usageLimit?.canUse}
              className="w-full h-12 text-base"
            >
              {analysisMutation.isPending ? "AI가 분석 중입니다..." : "신호 심층 분석 받기"}
            </Button>
          </>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-6">
            <h2 className="text-2xl font-bold text-white">분석 결과</h2>

            {/* 호감도 게이지 */}
            <div className="bg-slate-700/50 rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white">종합 호감도</h3>
                <div className="text-4xl font-bold text-pink-400">{result.probability}%</div>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    result.probability >= 60 ? "bg-green-500" : result.probability >= 40 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${result.probability}%` }}
                />
              </div>
              <div className="flex gap-4 mt-3 text-sm">
                <span className="text-green-400">✅ 긍정 신호 {result.positiveCount}개</span>
                <span className="text-red-400">❌ 부정 신호 {result.negativeCount}개</span>
              </div>
            </div>

            {/* AI 분석 */}
            <div className="bg-slate-700/50 rounded-lg p-5">
              <h3 className="text-base font-bold text-white mb-3">AI 심리 분석</h3>
              <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{result.analysis}</p>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => { setResult(null); setSelectedPositive([]); setSelectedNegative([]); setAdditionalContext(""); }} className="flex-1">
                새로운 분석
              </Button>
              <Button onClick={() => setLocation("/dashboard")} className="flex-1">대시보드로 돌아가기</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

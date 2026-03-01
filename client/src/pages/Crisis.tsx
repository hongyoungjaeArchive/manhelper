import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Copy, Check } from "lucide-react";

const CRISIS_TYPES = [
  { id: "coldwar", label: "냉전 / 무시" },
  { id: "fight", label: "잦은 다툼" },
  { id: "distance", label: "관심 감소 / 거리감" },
  { id: "ghosting", label: "연락 두절" },
  { id: "breakup", label: "이별 통보 / 위기" },
  { id: "jealousy", label: "외도 의심" },
  { id: "other", label: "기타" },
];

const DURATIONS = [
  { id: "today", label: "오늘" },
  { id: "few_days", label: "2~3일 전부터" },
  { id: "week", label: "일주일 전부터" },
  { id: "long", label: "한 달 이상" },
];

const EMOTIONS = [
  { id: "anxious", label: "불안함" },
  { id: "angry", label: "화남" },
  { id: "sad", label: "슬픔" },
  { id: "confused", label: "혼란스러움" },
  { id: "wronged", label: "억울함" },
  { id: "scared", label: "무서움" },
];

const GOALS = [
  { id: "reconcile", label: "화해하고 싶다" },
  { id: "talk", label: "대화를 시작하고 싶다" },
  { id: "restore", label: "관계를 회복하고 싶다" },
  { id: "prevent", label: "이별을 막고 싶다" },
  { id: "understand", label: "상황을 파악하고 싶다" },
];

function Chip({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm border transition ${
        selected
          ? "bg-red-500 border-red-500 text-white"
          : "bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-400"
      }`}
    >
      {label}
    </button>
  );
}

export default function Crisis() {
  const [, setLocation] = useLocation();
  const [crisisType, setCrisisType] = useState("");
  const [duration, setDuration] = useState("");
  const [emotions, setEmotions] = useState<string[]>([]);
  const [situation, setSituation] = useState("");
  const [goal, setGoal] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: usageLimit, refetch: refetchUsage } = trpc.aiConsultation.checkUsageLimit.useQuery();
  const crisisMutation = trpc.aiConsultation.crisis.useMutation();

  const toggleEmotion = (id: string) =>
    setEmotions(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);

  const buildSituation = () => {
    const typeLabel = CRISIS_TYPES.find(t => t.id === crisisType)?.label || "";
    const durationLabel = DURATIONS.find(d => d.id === duration)?.label || "";
    const emotionLabels = emotions.map(e => EMOTIONS.find(em => em.id === e)?.label).filter(Boolean).join(", ");
    const goalLabel = GOALS.find(g => g.id === goal)?.label || "";

    return `[위기 유형] ${typeLabel}
[언제부터] ${durationLabel}
[현재 내 감정] ${emotionLabels}
[원하는 결과] ${goalLabel}

[상황 설명]
${situation}`;
  };

  const handleAnalyze = async () => {
    if (!crisisType) { toast.error("위기 유형을 선택해주세요"); return; }
    if (!duration) { toast.error("언제부터 시작됐는지 선택해주세요"); return; }
    if (emotions.length === 0) { toast.error("현재 감정을 하나 이상 선택해주세요"); return; }
    if (!goal) { toast.error("원하는 결과를 선택해주세요"); return; }
    if (situation.trim().length < 10) { toast.error("상황을 10자 이상 설명해주세요"); return; }

    try {
      const response = await crisisMutation.mutateAsync({ situation: buildSituation() });
      setResult(response.analysis);
      refetchUsage();
      toast.success("분석이 완료되었습니다!");
    } catch (error: any) {
      toast.error(error.message || "분석 중 오류가 발생했습니다");
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      toast.success("복사되었습니다!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setCrisisType(""); setDuration(""); setEmotions([]);
    setSituation(""); setGoal(""); setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => setLocation("/dashboard")} className="text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-white">위기 대응</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {usageLimit && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-300 text-sm">
              오늘 남은 상담 횟수: <span className="font-bold text-red-500">{usageLimit.remaining}</span> / {usageLimit.limit}회
            </p>
          </div>
        )}

        {!result ? (
          <>
            {/* 1. 위기 유형 */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-base font-bold text-white mb-1">1. 어떤 위기인가요?</h2>
              <p className="text-slate-400 text-sm mb-4">현재 상황에 가장 가까운 것을 선택하세요</p>
              <div className="flex flex-wrap gap-2">
                {CRISIS_TYPES.map(t => (
                  <Chip key={t.id} label={t.label} selected={crisisType === t.id} onClick={() => setCrisisType(t.id)} />
                ))}
              </div>
            </div>

            {/* 2. 언제부터 */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-base font-bold text-white mb-1">2. 언제부터 이 상황이 시작됐나요?</h2>
              <p className="text-slate-400 text-sm mb-4">가장 가까운 시점을 선택하세요</p>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map(d => (
                  <Chip key={d.id} label={d.label} selected={duration === d.id} onClick={() => setDuration(d.id)} />
                ))}
              </div>
            </div>

            {/* 3. 현재 감정 */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-base font-bold text-white mb-1">3. 지금 어떤 감정인가요?</h2>
              <p className="text-slate-400 text-sm mb-4">해당되는 감정을 모두 선택하세요</p>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map(e => (
                  <Chip key={e.id} label={e.label} selected={emotions.includes(e.id)} onClick={() => toggleEmotion(e.id)} />
                ))}
              </div>
            </div>

            {/* 4. 원하는 결과 */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-base font-bold text-white mb-1">4. 어떤 결과를 원하나요?</h2>
              <p className="text-slate-400 text-sm mb-4">가장 원하는 것 하나를 선택하세요</p>
              <div className="flex flex-wrap gap-2">
                {GOALS.map(g => (
                  <Chip key={g.id} label={g.label} selected={goal === g.id} onClick={() => setGoal(g.id)} />
                ))}
              </div>
            </div>

            {/* 5. 상황 설명 */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-base font-bold text-white mb-1">5. 상황을 자세히 설명해주세요</h2>
              <p className="text-slate-400 text-sm mb-4">
                언제, 무슨 일이 있었는지 구체적으로 적을수록 정확한 조언을 받을 수 있어요
              </p>
              <textarea
                value={situation}
                onChange={e => setSituation(e.target.value.slice(0, 500))}
                placeholder="예: 3일 전 사소한 일로 다투고 나서 상대방이 연락을 잘 안 받고 있어요. 카톡은 읽는데 답장을 늦게 하거나 짧게만 해요. 평소에는 먼저 연락도 자주 했는데..."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 h-36 resize-none"
              />
              <p className="text-slate-400 text-sm mt-2 text-right">{situation.length} / 500자</p>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={crisisMutation.isPending || !usageLimit?.canUse}
              className="w-full h-12 text-base"
            >
              {crisisMutation.isPending ? "AI가 분석 중입니다..." : "AI 심층 분석 받기"}
            </Button>
          </>
        ) : (
          <div className="bg-slate-800 border border-red-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">AI 분석 결과</h2>
              <button onClick={handleCopy} className="flex items-center gap-2 text-slate-400 hover:text-white transition">
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-5">
              <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{result}</p>
            </div>
            <div className="mt-6 flex gap-4">
              <Button variant="outline" onClick={handleReset} className="flex-1">새로운 상황 분석</Button>
              <Button onClick={() => setLocation("/dashboard")} className="flex-1">대시보드로 돌아가기</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Copy, Check, MessageCircle } from "lucide-react";

const QUICK_CONTEXT = [
  { id: "fight", label: "다투고 나서" },
  { id: "cold", label: "갑자기 차가워졌을 때" },
  { id: "morning", label: "아침 첫 연락" },
  { id: "late", label: "늦은 밤 연락" },
  { id: "plan", label: "약속 관련" },
  { id: "ignore", label: "오래 연락 없다가" },
];

function ContextChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition ${
        selected
          ? "bg-violet-500 border-violet-500 text-white"
          : "bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-400"
      }`}
    >
      {label}
    </button>
  );
}

export default function HerMessage() {
  const [, setLocation] = useLocation();
  const [herMessage, setHerMessage] = useState("");
  const [quickCtx, setQuickCtx] = useState("");
  const [extraCtx, setExtraCtx] = useState("");
  const [result, setResult] = useState<{ analysis: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: usageLimit, refetch: refetchUsage } = trpc.aiConsultation.checkUsageLimit.useQuery();
  const herMsgMutation = trpc.aiConsultation.herMessage.useMutation();

  const handleAnalyze = async () => {
    if (!herMessage.trim()) {
      toast.error("그녀의 메시지를 입력해주세요");
      return;
    }

    const contextParts = [
      quickCtx ? QUICK_CONTEXT.find(c => c.id === quickCtx)?.label : "",
      extraCtx.trim(),
    ].filter(Boolean).join(" / ");

    try {
      const res = await herMsgMutation.mutateAsync({
        herMessage: herMessage.trim(),
        context: contextParts || undefined,
      });
      setResult(res);
      refetchUsage();
      toast.success("해독 완료!");
    } catch (error: any) {
      toast.error(error.message || "오류가 발생했습니다");
    }
  };

  // Extract recommended reply from analysis text
  const extractReply = (analysis: string): string => {
    const match = analysis.match(/💬[^\n]*\n(.*?)(\n|$)/);
    return match?.[1]?.trim() ?? "";
  };

  const handleCopyReply = () => {
    const reply = result ? extractReply(result.analysis) : "";
    if (reply) {
      navigator.clipboard.writeText(reply);
      setCopied(true);
      toast.success("답장 복사됨!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setHerMessage("");
    setQuickCtx("");
    setExtraCtx("");
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => setLocation("/dashboard")} className="text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">그녀의 메시지 해독</h1>
            <p className="text-xs text-slate-400">진짜 의도를 파악하고 완벽한 답장을 받아보세요</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {usageLimit && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-300 text-sm">
              오늘 남은 상담 횟수: <span className="font-bold text-violet-400">{usageLimit.remaining}</span> / {usageLimit.limit}회
            </p>
          </div>
        )}

        {!result ? (
          <>
            {/* Her message input */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="w-5 h-5 text-violet-400" />
                <h2 className="text-base font-bold text-white">그녀의 메시지</h2>
              </div>
              <p className="text-slate-400 text-sm mb-4">그녀가 보낸 메시지를 그대로 붙여넣으세요</p>
              <textarea
                value={herMessage}
                onChange={e => setHerMessage(e.target.value.slice(0, 500))}
                placeholder="예: 오늘 좀 피곤해서... 다음에 보자"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 h-28 resize-none"
                autoFocus
              />
              <p className="text-slate-400 text-xs mt-1 text-right">{herMessage.length} / 500자</p>
            </div>

            {/* Quick context */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-base font-bold text-white mb-1">어떤 상황인가요? <span className="text-slate-400 font-normal">(선택)</span></h2>
              <p className="text-slate-400 text-sm mb-4">메시지가 온 상황을 선택하면 더 정확한 분석이 가능해요</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {QUICK_CONTEXT.map(c => (
                  <ContextChip
                    key={c.id}
                    label={c.label}
                    selected={quickCtx === c.id}
                    onClick={() => setQuickCtx(prev => prev === c.id ? "" : c.id)}
                  />
                ))}
              </div>
              <textarea
                value={extraCtx}
                onChange={e => setExtraCtx(e.target.value.slice(0, 150))}
                placeholder="추가 상황 메모 (예: 어제 데이트 후 보낸 메시지)"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 h-16 resize-none text-sm"
              />
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={herMsgMutation.isPending || !usageLimit?.canUse || !herMessage.trim()}
              className="w-full h-12 text-base bg-violet-600 hover:bg-violet-500"
            >
              {herMsgMutation.isPending ? "AI가 해독 중..." : "메시지 해독하기"}
            </Button>

            {!usageLimit?.canUse && (
              <p className="text-center text-slate-400 text-sm">오늘 AI 사용 횟수를 모두 소진했습니다. 내일 다시 이용하세요.</p>
            )}
          </>
        ) : (
          <div className="bg-slate-800 border border-violet-500/30 rounded-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">해독 결과</h2>
              <button
                onClick={handleCopyReply}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition border border-slate-600 hover:border-violet-400 rounded-lg px-3 py-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                <span>답장 복사</span>
              </button>
            </div>

            {/* Original message */}
            <div className="bg-slate-700/40 rounded-lg px-4 py-3 border-l-2 border-violet-400">
              <p className="text-xs text-slate-400 mb-1">분석한 메시지</p>
              <p className="text-slate-200 text-sm">"{herMessage}"</p>
            </div>

            {/* AI analysis */}
            <div className="bg-slate-700/50 rounded-lg p-5">
              <p className="text-slate-100 whitespace-pre-wrap leading-relaxed">{result.analysis}</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                다른 메시지 분석
              </Button>
              <Button onClick={() => setLocation("/dashboard")} className="flex-1">
                대시보드
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

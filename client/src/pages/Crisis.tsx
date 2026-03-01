import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Copy, Check } from "lucide-react";

export default function Crisis() {
  const [, setLocation] = useLocation();
  const [situation, setSituation] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: usageLimit } = trpc.aiConsultation.checkUsageLimit.useQuery();
  const crisisMutation = trpc.aiConsultation.crisis.useMutation();

  const handleAnalyze = async () => {
    if (!situation.trim()) {
      toast.error("상황을 입력해주세요");
      return;
    }

    if (situation.length < 10) {
      toast.error("최소 10자 이상 입력해주세요");
      return;
    }

    try {
      const response = await crisisMutation.mutateAsync({
        situation,
      });
      setResult(response.analysis);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => setLocation("/dashboard")}
            className="text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-white">위기 대응</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Usage Info */}
        {usageLimit && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
            <p className="text-slate-300 text-sm">
              오늘 남은 상담 횟수: <span className="font-bold text-red-500">{usageLimit.remaining}</span> / {usageLimit.limit}회
            </p>
          </div>
        )}

        {/* Input Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">
            연애 위기 상황을 설명해주세요
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            현재 겪고 있는 연애 상황을 자세히 입력하면 AI가 즉각적인 전략을 제시합니다.
          </p>

          <textarea
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder="예: 상대방이 최근 연락이 줄어들었고, 만날 때도 예전처럼 따뜻하지 않은 것 같습니다. 어떻게 해야 할까요?"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 h-32 resize-none"
          />

          <div className="flex items-center justify-between mt-4">
            <p className="text-slate-400 text-sm">
              {situation.length} / 500자
            </p>
            <Button
              onClick={handleAnalyze}
              disabled={crisisMutation.isPending || !usageLimit?.canUse}
              className="w-32"
            >
              {crisisMutation.isPending ? "분석 중..." : "AI 분석"}
            </Button>
          </div>
        </div>

        {/* Result Section */}
        {result && (
          <div className="bg-slate-800 border border-red-500/30 rounded-lg p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">AI 분석 결과</h2>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-6">
              <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                {result}
              </p>
            </div>

            <div className="mt-6 flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSituation("");
                  setResult(null);
                }}
                className="flex-1"
              >
                새로운 상황 분석
              </Button>
              <Button
                onClick={() => setLocation("/dashboard")}
                className="flex-1"
              >
                대시보드로 돌아가기
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, X } from "lucide-react";

const POSITIVE_SIGNALS = [
  "자주 연락을 먼저 건다",
  "내 일에 관심을 보인다",
  "자주 만나자고 한다",
  "신체 접촉을 자연스럽게 한다",
  "내 의견을 존중해준다",
  "미래에 대해 함께 이야기한다",
  "내 친구들을 소개해주려 한다",
  "내 생일이나 기념일을 기억한다",
];

const NEGATIVE_SIGNALS = [
  "연락이 줄어들었다",
  "만날 때 어색한 분위기다",
  "다른 이성과 자주 만난다",
  "내 의견을 무시한다",
  "미래에 대해 말하지 않는다",
  "내 친구들을 만나려 하지 않는다",
  "휴대폰을 자주 확인한다",
  "예전처럼 따뜻하지 않다",
];

export default function SignalAnalysis() {
  const [, setLocation] = useLocation();
  const [selectedPositive, setSelectedPositive] = useState<string[]>([]);
  const [selectedNegative, setSelectedNegative] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);

  const { data: usageLimit } = trpc.aiConsultation.checkUsageLimit.useQuery();
  const analysisMutation = trpc.aiConsultation.signalAnalysis.useMutation();

  const handleAnalyze = async () => {
    if (selectedPositive.length === 0 && selectedNegative.length === 0) {
      toast.error("최소 하나 이상의 신호를 선택해주세요");
      return;
    }

    try {
      const response = await analysisMutation.mutateAsync({
        positiveSignals: selectedPositive,
        negativeSignals: selectedNegative,
      });
      setResult(response);
      toast.success("분석이 완료되었습니다!");
    } catch (error: any) {
      toast.error(error.message || "분석 중 오류가 발생했습니다");
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
          <h1 className="text-2xl font-bold text-white">썸 신호 분석</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Usage Info */}
        {usageLimit && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
            <p className="text-slate-300 text-sm">
              오늘 남은 상담 횟수: <span className="font-bold text-red-500">{usageLimit.remaining}</span> / {usageLimit.limit}회
            </p>
          </div>
        )}

        {!result ? (
          <>
            {/* Positive Signals */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-green-500">✓</span> 긍정 신호
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                상대방이 보이는 긍정적인 신호를 선택해주세요
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {POSITIVE_SIGNALS.map((signal) => (
                  <button
                    key={signal}
                    onClick={() => {
                      if (selectedPositive.includes(signal)) {
                        setSelectedPositive(
                          selectedPositive.filter((s) => s !== signal)
                        );
                      } else {
                        setSelectedPositive([...selectedPositive, signal]);
                      }
                    }}
                    className={`p-3 rounded-lg border text-left transition ${
                      selectedPositive.includes(signal)
                        ? "bg-green-500/20 border-green-500 text-white"
                        : "bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    {signal}
                  </button>
                ))}
              </div>
            </div>

            {/* Negative Signals */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-red-500">✗</span> 부정 신호
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                상대방이 보이는 부정적인 신호를 선택해주세요
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {NEGATIVE_SIGNALS.map((signal) => (
                  <button
                    key={signal}
                    onClick={() => {
                      if (selectedNegative.includes(signal)) {
                        setSelectedNegative(
                          selectedNegative.filter((s) => s !== signal)
                        );
                      } else {
                        setSelectedNegative([...selectedNegative, signal]);
                      }
                    }}
                    className={`p-3 rounded-lg border text-left transition ${
                      selectedNegative.includes(signal)
                        ? "bg-red-500/20 border-red-500 text-white"
                        : "bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    {signal}
                  </button>
                ))}
              </div>
            </div>

            {/* Analyze Button */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setLocation("/dashboard")}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={analysisMutation.isPending || !usageLimit?.canUse}
                className="flex-1"
              >
                {analysisMutation.isPending ? "분석 중..." : "신호 분석"}
              </Button>
            </div>
          </>
        ) : (
          // Result Section
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-6">분석 결과</h2>

            {/* Probability */}
            <div className="bg-slate-700/50 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">호감도</h3>
                <div className="text-4xl font-bold text-red-500">
                  {result.probability}%
                </div>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    result.probability >= 60
                      ? "bg-green-500"
                      : result.probability >= 40
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${result.probability}%` }}
                />
              </div>
            </div>

            {/* Analysis */}
            <div className="bg-slate-700/50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-white mb-3">상세 분석</h3>
              <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                {result.analysis}
              </p>
            </div>

            {/* Signal Summary */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-400 text-sm font-medium mb-1">
                  긍정 신호
                </p>
                <p className="text-white text-2xl font-bold">
                  {result.positiveCount}개
                </p>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm font-medium mb-1">
                  부정 신호
                </p>
                <p className="text-white text-2xl font-bold">
                  {result.negativeCount}개
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setSelectedPositive([]);
                  setSelectedNegative([]);
                }}
                className="flex-1"
              >
                새로운 분석
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

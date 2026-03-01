import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Copy, Check } from "lucide-react";

export default function Messages() {
  const [, setLocation] = useLocation();
  const [context, setContext] = useState("");
  const [category, setCategory] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: usageLimit } = trpc.aiConsultation.checkUsageLimit.useQuery();
  const { data: messages } = trpc.messages.list.useQuery();
  const generateMutation = trpc.messages.generate.useMutation();

  const handleGenerate = async () => {
    if (!context.trim()) {
      toast.error("상황을 입력해주세요");
      return;
    }

    if (context.length < 10) {
      toast.error("최소 10자 이상 입력해주세요");
      return;
    }

    try {
      await generateMutation.mutateAsync({
        context,
        category: category || undefined,
      });
      toast.success("메시지가 생성되었습니다!");
      setContext("");
      setCategory("");
    } catch (error: any) {
      toast.error(error.message || "메시지 생성 중 오류가 발생했습니다");
    }
  };

  const handleCopy = (message: string, index: number) => {
    navigator.clipboard.writeText(message);
    setCopiedId(index);
    toast.success("복사되었습니다!");
    setTimeout(() => setCopiedId(null), 2000);
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
          <h1 className="text-2xl font-bold text-white">메시지 생성</h1>
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

        {/* Generate Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">
            메시지를 생성해보세요
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            상황을 설명하면 AI가 자연스러운 메시지를 생성해드립니다.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                상황 설명
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="예: 오늘 상대방과 작은 싸움을 했는데 먼저 연락하고 싶어요"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 h-24 resize-none"
              />
              <p className="text-slate-400 text-sm mt-2">
                {context.length} / 300자
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                카테고리 (선택)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
              >
                <option value="">선택하세요</option>
                <option value="apology">사과</option>
                <option value="confession">고백</option>
                <option value="comfort">위로</option>
                <option value="proposal">제안</option>
                <option value="greeting">인사</option>
              </select>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setContext("");
                  setCategory("");
                }}
                className="flex-1"
              >
                초기화
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !usageLimit?.canUse}
                className="flex-1"
              >
                {generateMutation.isPending ? "생성 중..." : "메시지 생성"}
              </Button>
            </div>
          </div>
        </div>

        {/* Messages List */}
        {messages && messages.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
            <h2 className="text-xl font-bold text-white mb-4">
              생성된 메시지 ({messages.length})
            </h2>

            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={msg.id}
                  className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-slate-400 text-sm mb-2">
                        {msg.context}
                      </p>
                      <p className="text-white">{msg.message}</p>
                      {msg.category && (
                        <p className="text-slate-400 text-xs mt-2">
                          카테고리: {msg.category}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopy(msg.message, index)}
                      className="text-slate-400 hover:text-white transition flex-shrink-0"
                    >
                      {copiedId === index ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setLocation("/dashboard")}
              className="w-full mt-6"
            >
              대시보드로 돌아가기
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Copy, Check, RefreshCw } from "lucide-react";

const RECIPIENT_TYPES = [
  { id: "lover", label: "연인" },
  { id: "crush", label: "썸 상대" },
  { id: "unrequited", label: "짝사랑" },
  { id: "ex", label: "전 연인" },
  { id: "friend", label: "친구" },
];

const MESSAGE_TYPES = [
  { id: "apology", label: "사과 / 화해" },
  { id: "confession", label: "고백" },
  { id: "miss", label: "보고 싶다" },
  { id: "reconnect", label: "다시 연락 (오랜만에)" },
  { id: "comfort", label: "위로 / 공감" },
  { id: "thanks", label: "감사 표현" },
  { id: "date", label: "만남 제안" },
  { id: "daily", label: "일상 / 안부" },
];

const MOODS = [
  { id: "peaceful", label: "평화로운 분위기" },
  { id: "awkward", label: "약간 어색한 상황" },
  { id: "coldwar", label: "냉전 / 다툼 후" },
  { id: "longtime", label: "오랫동안 못 만남" },
  { id: "firstcontact", label: "처음 / 거의 처음 연락" },
];

const TONES = [
  { id: "warm", label: "따뜻하게" },
  { id: "honest", label: "솔직하게" },
  { id: "cute", label: "귀엽게 / 장난스럽게" },
  { id: "serious", label: "진지하게" },
  { id: "casual", label: "가볍게 / 자연스럽게" },
];

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm border transition ${
        selected
          ? "bg-purple-500 border-purple-500 text-white"
          : "bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-400"
      }`}
    >
      {label}
    </button>
  );
}

export default function Messages() {
  const [, setLocation] = useLocation();
  const [recipient, setRecipient] = useState("");
  const [messageType, setMessageType] = useState("");
  const [mood, setMood] = useState("");
  const [tone, setTone] = useState("");
  const [context, setContext] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: usageLimit, refetch: refetchUsage } = trpc.aiConsultation.checkUsageLimit.useQuery();
  const { data: messages, refetch: refetchMessages } = trpc.messages.list.useQuery();
  const generateMutation = trpc.messages.generate.useMutation();

  const buildContext = () => {
    const recipientLabel = RECIPIENT_TYPES.find(r => r.id === recipient)?.label || "";
    const typeLabel = MESSAGE_TYPES.find(m => m.id === messageType)?.label || "";
    const moodLabel = MOODS.find(m => m.id === mood)?.label || "";
    const toneLabel = TONES.find(t => t.id === tone)?.label || "";

    return `[보내는 대상] ${recipientLabel}
[메시지 목적] ${typeLabel}
[현재 분위기] ${moodLabel}
[원하는 말투] ${toneLabel}${context.trim() ? `\n[추가 상황] ${context.trim()}` : ""}`;
  };

  const handleGenerate = async () => {
    if (!recipient) { toast.error("보내는 대상을 선택해주세요"); return; }
    if (!messageType) { toast.error("메시지 목적을 선택해주세요"); return; }
    if (!mood) { toast.error("현재 분위기를 선택해주세요"); return; }
    if (!tone) { toast.error("원하는 말투를 선택해주세요"); return; }

    const category = MESSAGE_TYPES.find(m => m.id === messageType)?.label;

    try {
      await generateMutation.mutateAsync({ context: buildContext(), category });
      refetchMessages();
      refetchUsage();
      toast.success("메시지가 생성되었습니다!");
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

  const handleReset = () => {
    setRecipient(""); setMessageType(""); setMood(""); setTone(""); setContext("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => setLocation("/dashboard")} className="text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-white">메시지 생성</h1>
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

        {/* 입력 폼 */}
        <div className="space-y-5">
          {/* 1. 보내는 대상 */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-base font-bold text-white mb-1">1. 누구에게 보내는 메시지인가요?</h2>
            <p className="text-slate-400 text-sm mb-4">상대방과의 관계를 선택하세요</p>
            <div className="flex flex-wrap gap-2">
              {RECIPIENT_TYPES.map(r => (
                <Chip key={r.id} label={r.label} selected={recipient === r.id} onClick={() => setRecipient(r.id)} />
              ))}
            </div>
          </div>

          {/* 2. 메시지 목적 */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-base font-bold text-white mb-1">2. 어떤 목적의 메시지인가요?</h2>
            <p className="text-slate-400 text-sm mb-4">이 메시지로 전달하고 싶은 것을 선택하세요</p>
            <div className="flex flex-wrap gap-2">
              {MESSAGE_TYPES.map(m => (
                <Chip key={m.id} label={m.label} selected={messageType === m.id} onClick={() => setMessageType(m.id)} />
              ))}
            </div>
          </div>

          {/* 3. 현재 분위기 */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-base font-bold text-white mb-1">3. 지금 어떤 상황/분위기인가요?</h2>
            <p className="text-slate-400 text-sm mb-4">상대방과의 현재 관계 분위기를 선택하세요</p>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(m => (
                <Chip key={m.id} label={m.label} selected={mood === m.id} onClick={() => setMood(m.id)} />
              ))}
            </div>
          </div>

          {/* 4. 말투 */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-base font-bold text-white mb-1">4. 어떤 말투로 보내고 싶나요?</h2>
            <p className="text-slate-400 text-sm mb-4">메시지의 톤을 선택하세요</p>
            <div className="flex flex-wrap gap-2">
              {TONES.map(t => (
                <Chip key={t.id} label={t.label} selected={tone === t.id} onClick={() => setTone(t.id)} />
              ))}
            </div>
          </div>

          {/* 5. 추가 상황 (선택) */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-base font-bold text-white mb-1">5. 추가로 전달할 내용이 있나요? <span className="text-slate-400 font-normal">(선택)</span></h2>
            <p className="text-slate-400 text-sm mb-4">특별히 포함시키고 싶은 내용이나 상황을 적어주세요</p>
            <textarea
              value={context}
              onChange={e => setContext(e.target.value.slice(0, 200))}
              placeholder="예: 어제 카페에서 같이 공부한 거 얘기 나오면 좋겠어요"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 h-20 resize-none"
            />
            <p className="text-slate-400 text-sm mt-1 text-right">{context.length} / 200자</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset} className="flex-shrink-0">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !usageLimit?.canUse}
              className="flex-1 h-12 text-base"
            >
              {generateMutation.isPending ? "메시지 생성 중..." : "AI 메시지 생성"}
            </Button>
          </div>
        </div>

        {/* 생성된 메시지 목록 */}
        {messages && messages.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">생성된 메시지 ({messages.length})</h2>
            <div className="space-y-3">
              {messages.map((msg, index) => (
                <div key={msg.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {msg.category && (
                        <span className="inline-block bg-purple-500/20 text-purple-400 text-xs px-2 py-0.5 rounded mb-2">
                          {msg.category}
                        </span>
                      )}
                      <p className="text-white leading-relaxed">{msg.message}</p>
                      <p className="text-slate-500 text-xs mt-2">{msg.context?.split("\n")[0]}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(msg.message, index)}
                      className="text-slate-400 hover:text-white transition flex-shrink-0 mt-1"
                    >
                      {copiedId === index ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={() => setLocation("/dashboard")} className="w-full mt-4">대시보드로 돌아가기</Button>
          </div>
        )}
      </main>
    </div>
  );
}

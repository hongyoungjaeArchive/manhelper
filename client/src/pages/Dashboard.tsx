import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  AlertCircle,
  Zap,
  MessageSquare,
  BotMessageSquare,
  MessageCircle,
  Heart,
  Settings,
  LogOut,
  Flame,
} from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery();
  const { data: score } = trpc.relationshipScore.get.useQuery();
  const { data: usageLimit } = trpc.aiConsultation.checkUsageLimit.useQuery();

  const relTypeLabel: Record<string, string> = {
    dating: "연인",
    crush: "썸녀",
    longDistance: "장거리 연인",
    newlywed: "신혼",
  };
  const relLabel = profile?.relationshipType ? (relTypeLabel[profile.relationshipType] ?? "연인") : null;

  const usagePercent = usageLimit ? (usageLimit.used / usageLimit.limit) * 100 : 0;
  const usageColor = usageLimit?.remaining === 0
    ? "bg-red-500"
    : usageLimit?.remaining === 1
    ? "bg-yellow-500"
    : "bg-emerald-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500" />
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-red-500 to-pink-400 bg-clip-text text-transparent">
              LOVIQ
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocation("/settings")}
              className="p-2 text-slate-500 hover:text-slate-200 transition rounded-lg hover:bg-slate-800"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => logout()}
              className="p-2 text-slate-500 hover:text-slate-200 transition rounded-lg hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Status bar */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider">
              {relLabel && profile?.partnerName ? `${relLabel} · ${profile.partnerName}` : "연애 전략 센터"}
            </p>
            <h2 className="text-xl font-bold text-white mt-0.5">
              {profile?.nickname || "사용자"}의 작전실
            </h2>
          </div>
          {score && (
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider">관계 온도</p>
              <p className={`text-3xl font-black ${score.score >= 60 ? "text-emerald-400" : score.score >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                {score.score}
              </p>
            </div>
          )}
        </div>

        {/* Relationship score gauge */}
        {score && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>관계 건강도</span>
              <span>{score.score} / 100</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${score.score >= 60 ? "bg-emerald-500" : score.score >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${score.score}%` }}
              />
            </div>
          </div>
        )}

        {/* AI usage */}
        {usageLimit && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-300 font-medium">오늘의 AI 사용</p>
              <div className="flex items-center gap-1.5">
                {[...Array(usageLimit.limit)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full border ${
                      i < usageLimit.used
                        ? "bg-slate-600 border-slate-600"
                        : "border-emerald-500 bg-emerald-500/20"
                    }`}
                  />
                ))}
                <span className="text-sm font-bold text-white ml-1">{usageLimit.remaining}회 남음</span>
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div
                className={`${usageColor} h-1.5 rounded-full transition-all`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Feature grid */}
        <div className="space-y-3">
          {/* AI 채팅 - full width, top CTA */}
          <button
            onClick={() => setLocation("/chat")}
            className="w-full bg-gradient-to-r from-red-600/20 to-pink-600/20 border border-red-500/40 hover:border-red-400 rounded-xl p-5 text-left transition group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/30 transition">
                <BotMessageSquare className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="font-bold text-white">AI 1:1 상담</p>
                <p className="text-slate-400 text-sm mt-0.5">고민을 털어놓으면 즉각 전략을 드립니다</p>
              </div>
            </div>
          </button>

          {/* 2-col grid */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setLocation("/her-message")}
              className="bg-slate-800/60 border border-slate-700 hover:border-violet-500 rounded-xl p-4 text-left transition group"
            >
              <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center mb-3 group-hover:bg-violet-500/30 transition">
                <MessageCircle className="w-5 h-5 text-violet-400" />
              </div>
              <p className="font-bold text-white text-sm">메시지 해독</p>
              <p className="text-slate-400 text-xs mt-1">그녀의 진짜 의도 파악</p>
            </button>

            <button
              onClick={() => setLocation("/signal-analysis")}
              className="bg-slate-800/60 border border-slate-700 hover:border-pink-500 rounded-xl p-4 text-left transition group"
            >
              <div className="w-9 h-9 rounded-lg bg-pink-500/20 flex items-center justify-center mb-3 group-hover:bg-pink-500/30 transition">
                <Heart className="w-5 h-5 text-pink-400" />
              </div>
              <p className="font-bold text-white text-sm">신호 분석</p>
              <p className="text-slate-400 text-xs mt-1">호감도 정밀 측정</p>
            </button>

            <button
              onClick={() => setLocation("/crisis")}
              className="bg-slate-800/60 border border-slate-700 hover:border-orange-500 rounded-xl p-4 text-left transition group"
            >
              <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center mb-3 group-hover:bg-orange-500/30 transition">
                <AlertCircle className="w-5 h-5 text-orange-400" />
              </div>
              <p className="font-bold text-white text-sm">위기 대응</p>
              <p className="text-slate-400 text-xs mt-1">냉전·다툼 즉각 해결</p>
            </button>

            <button
              onClick={() => setLocation("/messages")}
              className="bg-slate-800/60 border border-slate-700 hover:border-purple-500 rounded-xl p-4 text-left transition group"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3 group-hover:bg-purple-500/30 transition">
                <MessageSquare className="w-5 h-5 text-purple-400" />
              </div>
              <p className="font-bold text-white text-sm">메시지 생성</p>
              <p className="text-slate-400 text-xs mt-1">완벽한 카톡 한 줄</p>
            </button>
          </div>

          {/* Profile */}
          <button
            onClick={() => setLocation("/profile")}
            className="w-full bg-slate-800/40 border border-slate-700/50 hover:border-slate-500 rounded-xl p-4 text-left transition flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">프로필 관리</p>
              <p className="text-xs text-slate-500">
                {profile
                  ? `${profile.partnerName} · ${relTypeLabel[profile.relationshipType] ?? ""}`
                  : "상대방 정보 입력"}
              </p>
            </div>
          </button>
        </div>

        <p className="text-center text-slate-600 text-xs pb-4">
          지극히 개인적인 AI 연애 코칭 · 남자들만을 위한 앱
        </p>
      </main>
    </div>
  );
}

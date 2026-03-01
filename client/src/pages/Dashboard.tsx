import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Heart, AlertCircle, Zap, MessageSquare, BotMessageSquare } from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { data: profile } = trpc.profile.get.useQuery();
  const { data: score } = trpc.relationshipScore.get.useQuery();
  const { data: usageLimit } = trpc.aiConsultation.checkUsageLimit.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
              Loviq AI
            </span>
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/settings")}
              className="text-slate-400 hover:text-white transition"
            >
              설정
            </button>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            안녕하세요, {profile?.nickname || "사용자"}님!
          </h2>
          <p className="text-slate-400">
            {profile?.partnerName}과의 관계를 더 나아지게 만들어보세요.
          </p>
        </div>

        {/* Relationship Score Card */}
        {score && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  관계 점수
                </h3>
                <p className="text-slate-400">
                  {profile?.partnerName}과의 관계 건강도
                </p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold text-red-500">
                  {score.score}
                </div>
                <p className="text-slate-400 text-sm">/ 100</p>
              </div>
            </div>

            {/* Gauge */}
            <div className="mt-6">
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-red-500 to-pink-500 h-3 rounded-full transition-all"
                  style={{ width: `${score.score}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Usage Limit */}
        {usageLimit && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  오늘의 AI 상담 횟수
                </h3>
                <p className="text-slate-400 text-sm">
                  {usageLimit.used} / {usageLimit.limit}회 사용
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-500">
                  {usageLimit.remaining}
                </div>
                <p className="text-slate-400 text-sm">회 남음</p>
              </div>
            </div>
            <div className="mt-4 w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${(usageLimit.used / usageLimit.limit) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => setLocation("/chat")}
            className="bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/40 rounded-lg p-6 hover:border-red-400 transition text-left md:col-span-2"
          >
            <div className="flex items-start gap-4">
              <BotMessageSquare className="w-8 h-8 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  AI 채팅 상담
                </h3>
                <p className="text-slate-400 text-sm">
                  AI 상담사와 대화하며 연애 고민을 함께 해결하세요.
                </p>
              </div>
            </div>
          </button>
          <button
            onClick={() => setLocation("/crisis")}
            className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-red-500 transition text-left"
          >
            <div className="flex items-start gap-4">
              <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  위기 대응
                </h3>
                <p className="text-slate-400 text-sm">
                  연애 위기 상황을 입력하고 즉각적인 전략을 받으세요.
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setLocation("/signal-analysis")}
            className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-pink-500 transition text-left"
          >
            <div className="flex items-start gap-4">
              <Heart className="w-8 h-8 text-pink-500 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  썸 신호 분석
                </h3>
                <p className="text-slate-400 text-sm">
                  상대방의 신호를 분석하고 호감도를 확인하세요.
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setLocation("/messages")}
            className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-purple-500 transition text-left"
          >
            <div className="flex items-start gap-4">
              <MessageSquare className="w-8 h-8 text-purple-500 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  메시지 생성
                </h3>
                <p className="text-slate-400 text-sm">
                  AI가 생성한 추천 메시지를 확인하고 복사하세요.
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setLocation("/profile")}
            className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition text-left"
          >
            <div className="flex items-start gap-4">
              <Zap className="w-8 h-8 text-blue-500 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  프로필 관리
                </h3>
                <p className="text-slate-400 text-sm">
                  관계 정보와 상대방 프로필을 수정하세요.
                </p>
              </div>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}

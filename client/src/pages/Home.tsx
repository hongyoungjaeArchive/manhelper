import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Heart, Zap, TrendingUp } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
              Loviq AI
            </span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setLocation("/login")}>
              로그인
            </Button>
            <Button onClick={() => setLocation("/signup")}>
              회원가입
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            연애 상황에서의
            <br />
            <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
              즉각적인 전략
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Loviq AI는 감정적인 조언이 아닌, 데이터 기반의 전략적 의사결정을 제공합니다.
            복잡한 연애 상황을 단순하고 명확하게 분석해드립니다.
          </p>
        </div>

        <div className="flex gap-4 justify-center mb-16">
          <Button size="lg" onClick={() => setLocation("/signup")}>
            지금 시작하기
          </Button>
          <Button size="lg" variant="outline">
            더 알아보기
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
            <div className="mb-4 flex justify-center">
              <Zap className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">위기 대응</h3>
            <p className="text-slate-400">
              연애 위기 상황을 입력하면 AI가 즉각적인 전략과 행동 방안을 제시합니다.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
            <div className="mb-4 flex justify-center">
              <Heart className="w-12 h-12 text-pink-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">썸 신호 분석</h3>
            <p className="text-slate-400">
              상대방의 긍정/부정 신호를 체크하면 호감도를 정확히 분석해드립니다.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
            <div className="mb-4 flex justify-center">
              <TrendingUp className="w-12 h-12 text-purple-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">관계 점수 추적</h3>
            <p className="text-slate-400">
              관계의 건강도를 시각적으로 추적하고 개선 방향을 제시합니다.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border-t border-slate-700 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-4">
            지금 바로 시작해보세요
          </h2>
          <p className="text-slate-300 mb-8">
            Loviq AI와 함께 더 나은 연애 결정을 내려보세요.
            무료로 시작할 수 있습니다.
          </p>
          <Button size="lg" onClick={() => setLocation("/signup")}>
            회원가입하기
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400">
          <p>&copy; 2026 Loviq AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

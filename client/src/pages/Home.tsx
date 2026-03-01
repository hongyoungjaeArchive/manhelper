import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Flame, MessageCircle, Heart, AlertCircle, BotMessageSquare, ArrowRight, Shield } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500" />
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-red-500 to-pink-400 bg-clip-text text-transparent">
              LOVIQ
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocation("/login")}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white transition"
            >
              로그인
            </button>
            <button
              onClick={() => setLocation("/signup")}
              className="px-4 py-2 text-sm bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-semibold rounded-lg transition"
            >
              무료 시작
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 mb-6">
          <Shield className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs text-red-300 font-medium">남자들만을 위한 AI 연애 코치</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black mb-5 leading-tight">
          연애,<br />
          <span className="bg-gradient-to-r from-red-500 via-pink-500 to-rose-400 bg-clip-text text-transparent">
            이제 전략이다
          </span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
          감정적 판단 말고 데이터 기반 전술.<br />
          AI가 그녀의 심리를 분석하고 최적의 행동을 알려드립니다.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setLocation("/signup")}
            className="flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold rounded-xl text-base transition"
          >
            지금 무료로 시작하기
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLocation("/login")}
            className="px-7 py-3.5 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-semibold rounded-xl text-base transition"
          >
            로그인
          </button>
        </div>

        <p className="text-slate-500 text-xs mt-4">무료 · 이메일 불필요 · 아이디만으로 시작</p>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            {
              icon: <BotMessageSquare className="w-6 h-6 text-red-400" />,
              bg: "bg-red-500/10 border-red-500/20",
              title: "AI 1:1 상담",
              desc: "연애 고민을 털어놓으면 즉각 전략 제시",
            },
            {
              icon: <MessageCircle className="w-6 h-6 text-violet-400" />,
              bg: "bg-violet-500/10 border-violet-500/20",
              title: "메시지 해독",
              desc: "그녀의 카톡, 진짜 의도를 파악",
            },
            {
              icon: <Heart className="w-6 h-6 text-pink-400" />,
              bg: "bg-pink-500/10 border-pink-500/20",
              title: "신호 분석",
              desc: "호감도를 수치로 정밀 측정",
            },
            {
              icon: <AlertCircle className="w-6 h-6 text-orange-400" />,
              bg: "bg-orange-500/10 border-orange-500/20",
              title: "위기 대응",
              desc: "냉전·다툼 상황 즉각 해결책",
            },
          ].map(f => (
            <div key={f.title} className={`border ${f.bg} rounded-xl p-5`}>
              <div className="mb-3">{f.icon}</div>
              <p className="font-bold text-white text-sm mb-1">{f.title}</p>
              <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof / tagline */}
      <section className="border-t border-slate-800 bg-gradient-to-r from-red-500/5 to-pink-500/5 py-14">
        <div className="max-w-xl mx-auto text-center px-4">
          <p className="text-slate-300 text-lg font-semibold mb-2">
            "감이 아닌 전략으로 연애하세요"
          </p>
          <p className="text-slate-500 text-sm mb-8">
            AI가 심리를 분석하고, 타이밍을 잡아주고, 메시지까지 써줍니다.
          </p>
          <button
            onClick={() => setLocation("/signup")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold rounded-xl transition"
          >
            지금 바로 시작 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold text-slate-400">LOVIQ</span>
          </div>
          <p className="text-slate-600 text-xs">&copy; 2026 Loviq AI</p>
        </div>
      </footer>
    </div>
  );
}

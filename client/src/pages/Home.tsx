import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Flame, MessageCircle, Heart, AlertCircle, BotMessageSquare, ArrowRight, Shield, ChevronRight } from "lucide-react";

const SLIDES = [
  {
    iconEl: <Flame className="w-14 h-14 text-red-400" />,
    iconBg: "bg-gradient-to-br from-red-500/30 to-pink-500/20",
    accentColor: "text-red-400",
    badge: "남자들만을 위한 AI 연애 코치",
    title: "연애,\n이제 전략이다",
    titleGradient: true,
    desc: "감정적 판단 말고 데이터 기반 전술.\nAI가 그녀의 심리를 분석하고\n최적의 행동을 알려드립니다.",
  },
  {
    iconEl: <BotMessageSquare className="w-14 h-14 text-red-400" />,
    iconBg: "bg-gradient-to-br from-red-500/30 to-orange-500/10",
    accentColor: "text-red-400",
    badge: "AI 1:1 상담",
    title: "고민을 털어놓으면\n즉각 전략 제시",
    titleGradient: false,
    desc: "연애의 모든 순간 AI 상담사가 함께합니다.\n타이밍, 말투, 행동까지\n세밀하게 맞춤 조언해 드립니다.",
  },
  {
    iconEl: <MessageCircle className="w-14 h-14 text-violet-400" />,
    iconBg: "bg-gradient-to-br from-violet-500/30 to-pink-500/10",
    accentColor: "text-violet-400",
    badge: "메시지 해독 · 신호 분석",
    title: "그녀의 진심을\n파악하다",
    titleGradient: false,
    desc: "카톡 한 줄도 AI가 심리 분석.\n호감도를 수치로 정밀 측정하고\n완벽한 답장까지 제안합니다.",
  },
  {
    iconEl: <AlertCircle className="w-14 h-14 text-orange-400" />,
    iconBg: "bg-gradient-to-br from-orange-500/30 to-red-500/10",
    accentColor: "text-orange-400",
    badge: "위기 대응",
    title: "냉전도 다툼도\n이제 두렵지 않다",
    titleGradient: false,
    desc: "위기 상황에서 최적의 대응 전략.\n관계를 회복하고 더 강하게\n만드는 방법을 알려드립니다.",
  },
];

const LAST = SLIDES.length; // index for CTA slide

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [slide, setSlide] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const [animating, setAnimating] = useState(false);
  const touchStartX = useRef<number | null>(null);

  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  const total = SLIDES.length + 1; // +1 for CTA slide

  const goTo = (idx: number, direction: "next" | "prev" = "next") => {
    if (animating || idx === slide) return;
    setDir(direction);
    setAnimating(true);
    setTimeout(() => {
      setSlide(idx);
      setAnimating(false);
    }, 280);
  };

  const next = () => goTo(Math.min(slide + 1, total - 1), "next");
  const skip = () => goTo(LAST, "next");

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0 && slide < total - 1) goTo(slide + 1, "next");
      if (dx > 0 && slide > 0) goTo(slide - 1, "prev");
    }
    touchStartX.current = null;
  };

  const isCTA = slide === LAST;
  const current = SLIDES[slide];

  return (
    <div
      className="h-[100dvh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-red-500" />
          <span className="text-lg font-black tracking-tight bg-gradient-to-r from-red-500 to-pink-400 bg-clip-text text-transparent">
            LOVIQ
          </span>
        </div>
        {!isCTA && (
          <button
            onClick={skip}
            className="text-slate-400 hover:text-white text-sm transition px-2 py-1"
          >
            건너뛰기
          </button>
        )}
      </header>

      {/* Slide content */}
      <main className="flex-1 flex items-center justify-center px-6 overflow-hidden">
        <div
          className={`w-full max-w-sm text-center transition-all duration-280 ease-in-out ${
            animating
              ? dir === "next"
                ? "-translate-x-8 opacity-0"
                : "translate-x-8 opacity-0"
              : "translate-x-0 opacity-100"
          }`}
        >
          {!isCTA ? (
            <>
              {/* Icon */}
              <div className={`w-24 h-24 ${current.iconBg} rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg`}>
                {current.iconEl}
              </div>

              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-5">
                <Shield className={`w-3 h-3 ${current.accentColor}`} />
                <span className={`text-xs font-medium ${current.accentColor}`}>{current.badge}</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-black mb-4 leading-tight whitespace-pre-line">
                {current.titleGradient ? (
                  <>
                    {current.title.split("\n")[0]}{"\n"}
                    <span className="bg-gradient-to-r from-red-500 via-pink-500 to-rose-400 bg-clip-text text-transparent">
                      {current.title.split("\n")[1]}
                    </span>
                  </>
                ) : (
                  current.title
                )}
              </h1>

              {/* Description */}
              <p className="text-slate-400 text-base leading-relaxed whitespace-pre-line">
                {current.desc}
              </p>
            </>
          ) : (
            <>
              {/* CTA slide */}
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-red-500/30">
                <Flame className="w-10 h-10 text-white" />
              </div>

              <h1 className="text-3xl font-black mb-3 leading-tight">
                지금 바로<br />
                <span className="bg-gradient-to-r from-red-500 via-pink-500 to-rose-400 bg-clip-text text-transparent">
                  시작하세요
                </span>
              </h1>
              <p className="text-slate-400 text-base mb-10 leading-relaxed">
                무료 · 이메일 불필요<br />아이디만으로 시작
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setLocation("/signup")}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold rounded-2xl text-base transition"
                >
                  무료로 시작하기
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setLocation("/login")}
                  className="w-full py-4 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-semibold rounded-2xl text-base transition"
                >
                  이미 계정이 있어요
                </button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  onClick={() => setLocation("/privacy")}
                  className="text-slate-600 hover:text-slate-400 text-xs transition"
                >
                  개인정보처리방침
                </button>
                <span className="text-slate-700 text-xs">·</span>
                <button
                  onClick={() => setLocation("/terms")}
                  className="text-slate-600 hover:text-slate-400 text-xs transition"
                >
                  이용약관
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Bottom: dots + next button */}
      <footer className="flex-shrink-0 px-6 pb-8 pt-4">
        <div className="flex items-center justify-between">
          {/* Dot indicators */}
          <div className="flex items-center gap-2">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i, i > slide ? "next" : "prev")}
                className={`rounded-full transition-all duration-300 ${
                  i === slide
                    ? "w-6 h-2 bg-red-500"
                    : "w-2 h-2 bg-slate-600 hover:bg-slate-500"
                }`}
              />
            ))}
          </div>

          {/* Next button (hidden on CTA slide) */}
          {!isCTA && (
            <button
              onClick={next}
              className="w-12 h-12 bg-gradient-to-br from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 rounded-full flex items-center justify-center transition shadow-lg shadow-red-500/20"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

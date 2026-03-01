import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Flame, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{4,20}$/;

type CheckState = "idle" | "checking" | "available" | "taken" | "invalid";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { refresh } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 아이디 중복 체크 (디바운스)
  const checkUsername = useCallback(async (val: string) => {
    if (!val) { setCheckState("idle"); return; }
    if (!USERNAME_REGEX.test(val)) { setCheckState("invalid"); return; }
    setCheckState("checking");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? ""}/api/auth/check-username?username=${encodeURIComponent(val)}`,
        { credentials: "include" }
      );
      const data = await res.json();
      setCheckState(data.available ? "available" : "taken");
    } catch {
      setCheckState("idle");
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => checkUsername(username), 500);
    return () => clearTimeout(t);
  }, [username, checkUsername]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!USERNAME_REGEX.test(username)) {
      setError("아이디는 영문·숫자·언더스코어 조합 4~20자여야 합니다.");
      return;
    }
    if (checkState === "taken") {
      setError("이미 사용 중인 아이디입니다.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (password !== confirmPw) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) setError("이미 사용 중인 아이디입니다.");
        else setError(data.error || "회원가입에 실패했습니다.");
      } else {
        await refresh();
        setLocation("/onboarding");
      }
    } catch {
      setError("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const usernameHint = () => {
    if (checkState === "idle") return null;
    if (checkState === "invalid") return { ok: false, msg: "영문·숫자·언더스코어(_) 4~20자로 입력하세요" };
    if (checkState === "checking") return null;
    if (checkState === "available") return { ok: true, msg: "사용 가능한 아이디예요" };
    if (checkState === "taken") return { ok: false, msg: "이미 사용 중인 아이디예요" };
    return null;
  };

  const hint = usernameHint();
  const pwMatch = confirmPw.length > 0 && password === confirmPw;
  const pwMismatch = confirmPw.length > 0 && password !== confirmPw;
  const canSubmit = checkState === "available" && password.length >= 6 && password === confirmPw && !loading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => setLocation("/")} className="inline-flex items-center gap-2 mb-3 hover:opacity-80 transition">
            <Flame className="w-7 h-7 text-red-500" />
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-red-500 to-pink-400 bg-clip-text text-transparent">
              LOVIQ
            </span>
          </button>
          <p className="text-slate-400 text-sm">남자들만을 위한 AI 연애 코치</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-7 shadow-xl shadow-black/30">
          <h2 className="text-lg font-bold text-white mb-5">회원가입</h2>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">아이디</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="영문·숫자·_ 조합 4~20자"
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/\s/g, ""))}
                  autoFocus
                  autoComplete="username"
                  maxLength={20}
                  className={`w-full bg-slate-700/60 border rounded-xl px-4 py-3 pr-10 text-white placeholder-slate-500 focus:outline-none focus:bg-slate-700 transition text-base ${
                    checkState === "available" ? "border-emerald-500" :
                    checkState === "taken" || checkState === "invalid" ? "border-red-500" :
                    "border-slate-600 focus:border-red-500"
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkState === "checking" && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                  {checkState === "available" && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  {(checkState === "taken" || checkState === "invalid") && <XCircle className="w-4 h-4 text-red-400" />}
                </div>
              </div>
              {hint && (
                <p className={`text-xs mt-1.5 ${hint.ok ? "text-emerald-400" : "text-red-400"}`}>
                  {hint.msg}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">비밀번호 <span className="text-slate-500">(6자 이상)</span></label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="비밀번호 입력"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full bg-slate-700/60 border border-slate-600 rounded-xl px-4 py-3 pr-11 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:bg-slate-700 transition text-base"
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">비밀번호 확인</label>
              <div className="relative">
                <input
                  type={showConfirmPw ? "text" : "password"}
                  placeholder="비밀번호 재입력"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  autoComplete="new-password"
                  className={`w-full bg-slate-700/60 border rounded-xl px-4 py-3 pr-11 text-white placeholder-slate-500 focus:outline-none focus:bg-slate-700 transition text-base ${
                    pwMatch ? "border-emerald-500" : pwMismatch ? "border-red-500" : "border-slate-600 focus:border-red-500"
                  }`}
                />
                <button type="button" onClick={() => setShowConfirmPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition">
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pwMismatch && <p className="text-xs text-red-400 mt-1.5">비밀번호가 일치하지 않습니다</p>}
              {pwMatch && <p className="text-xs text-emerald-400 mt-1.5">비밀번호가 일치합니다</p>}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl py-3 transition mt-1 text-sm"
            >
              {loading ? "가입 중..." : "시작하기"}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-700 text-center">
            <p className="text-slate-400 text-sm">
              이미 계정이 있으신가요?{" "}
              <button
                onClick={() => setLocation("/login")}
                className="text-red-400 hover:text-red-300 font-semibold transition"
              >
                로그인
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

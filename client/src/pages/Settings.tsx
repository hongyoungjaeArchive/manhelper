import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowLeft } from "lucide-react";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
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
          <h1 className="text-2xl font-bold text-white">설정</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Account Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">계정</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <div>
                <p className="text-slate-300 text-sm">이메일</p>
                <p className="text-white font-medium">{user?.email || "미설정"}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <div>
                <p className="text-slate-300 text-sm">이름</p>
                <p className="text-white font-medium">{user?.name || "미설정"}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm">가입일</p>
                <p className="text-white font-medium">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("ko-KR")
                    : "미설정"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* App Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">앱 정보</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm">버전</p>
                <p className="text-white font-medium">1.0.0</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm">개발사</p>
                <p className="text-white font-medium">Loviq AI</p>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8">
          <h2 className="text-xl font-bold text-red-500 mb-4">위험 영역</h2>

          <div className="space-y-4">
            <div>
              <p className="text-slate-300 text-sm mb-4">
                로그아웃하면 현재 세션이 종료됩니다.
              </p>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full border-red-500 text-red-500 hover:bg-red-500/10"
              >
                로그아웃
              </Button>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <Button
            variant="outline"
            onClick={() => setLocation("/dashboard")}
            className="w-full"
          >
            대시보드로 돌아가기
          </Button>
        </div>
      </main>
    </div>
  );
}

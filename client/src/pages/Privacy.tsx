import { useLocation } from "wouter";
import { Flame, ArrowLeft } from "lucide-react";

export default function Privacy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center gap-4">
          <button onClick={() => setLocation("/")} className="text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500" />
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-red-500 to-pink-400 bg-clip-text text-transparent">
              LOVIQ
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-black mb-2 text-white">개인정보처리방침</h1>
        <p className="text-slate-400 text-sm mb-10">최종 수정일: 2026년 3월 2일</p>

        <div className="space-y-10 text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. 개인정보 처리 목적</h2>
            <p>
              Loviq AI(이하 "서비스")는 다음의 목적을 위해 개인정보를 처리합니다.
              처리한 개인정보는 다음의 목적 이외의 용도로는 사용되지 않으며,
              이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등
              필요한 조치를 이행할 예정입니다.
            </p>
            <ul className="mt-3 space-y-1 list-disc list-inside text-slate-400">
              <li>회원 가입 및 본인 확인</li>
              <li>AI 연애 상담 서비스 제공</li>
              <li>서비스 이용 기록 관리</li>
              <li>서비스 개선 및 신규 기능 개발</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. 수집하는 개인정보 항목</h2>
            <p>서비스는 다음의 개인정보 항목을 수집합니다.</p>
            <div className="mt-3 bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-3">
              <div>
                <p className="text-white font-semibold text-sm mb-1">필수 수집 항목</p>
                <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                  <li>아이디 (사용자명)</li>
                  <li>비밀번호 (암호화 저장)</li>
                </ul>
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-1">서비스 이용 과정에서 자동 생성·수집되는 항목</p>
                <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                  <li>AI 상담 이용 기록 및 횟수</li>
                  <li>서비스 내 입력한 연애 관련 정보 (프로필, 상담 내역)</li>
                  <li>접속 일시, 서비스 이용 기록</li>
                </ul>
              </div>
            </div>
            <p className="mt-3 text-slate-500 text-sm">
              * 이메일 주소는 수집하지 않습니다. 서비스는 아이디만으로 가입 및 이용이 가능합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. 개인정보 보유 및 이용 기간</h2>
            <p>
              서비스는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에
              동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
            </p>
            <ul className="mt-3 list-disc list-inside text-slate-400 space-y-1">
              <li>회원 탈퇴 시까지 (탈퇴 후 즉시 삭제)</li>
              <li>관계 법령에 따라 보존이 필요한 경우 해당 기간까지</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. 개인정보의 제3자 제공</h2>
            <p>
              서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
              다만, AI 응답 생성을 위해 사용자가 입력한 상담 내용이 AI 서비스 제공업체(Groq Inc.)의
              서버로 전송될 수 있으며, 해당 내용은 서비스 응답 생성에만 사용됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. 개인정보의 파기</h2>
            <p>
              서비스는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는
              지체없이 해당 개인정보를 파기합니다. 회원 탈퇴 요청 시 모든 개인정보 및 이용 기록은
              즉시 삭제됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. 정보주체의 권리</h2>
            <p>이용자는 개인정보 주체로서 다음과 같은 권리를 행사할 수 있습니다.</p>
            <ul className="mt-3 list-disc list-inside text-slate-400 space-y-1">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구 (서비스 탈퇴)</li>
              <li>처리 정지 요구</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. 쿠키(Cookie) 사용</h2>
            <p>
              서비스는 로그인 상태 유지를 위해 쿠키를 사용합니다. 쿠키는 웹사이트 운영에 필요한
              세션 정보만을 저장하며, 광고 목적의 추적 쿠키는 사용하지 않습니다.
              브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 서비스 이용이
              제한될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. 광고 서비스</h2>
            <p>
              본 서비스는 Google AdSense를 통한 광고를 게재할 수 있습니다.
              Google AdSense는 서비스 이용자의 관심사에 맞는 광고를 제공하기 위해
              쿠키를 사용할 수 있습니다. 이용자는 Google 광고 설정 페이지(
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:text-red-300 underline"
              >
                adssettings.google.com
              </a>
              )에서 맞춤 광고를 거부할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. 개인정보 보호책임자</h2>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 text-sm text-slate-400">
              <p><span className="text-white font-semibold">서비스명:</span> Loviq AI</p>
              <p className="mt-1"><span className="text-white font-semibold">이메일:</span> loviq.official@gmail.com</p>
            </div>
            <p className="mt-3 text-slate-400 text-sm">
              개인정보 처리에 관한 문의, 불만 처리, 피해 구제 등을 위해 위 연락처로 문의하시기 바랍니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. 개인정보처리방침의 변경</h2>
            <p>
              이 개인정보처리방침은 2026년 3월 2일부터 적용되며, 법령 및 방침에 따른 변경내용의
              추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항 또는
              서비스 내 공지를 통하여 고지할 것입니다.
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 mt-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-slate-600 text-xs">&copy; 2026 Loviq AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

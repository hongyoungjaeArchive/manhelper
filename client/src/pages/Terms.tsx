import { useLocation } from "wouter";
import { Flame, ArrowLeft } from "lucide-react";

export default function Terms() {
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
        <h1 className="text-3xl font-black mb-2 text-white">이용약관</h1>
        <p className="text-slate-400 text-sm mb-10">최종 수정일: 2026년 3월 2일 · 시행일: 2026년 3월 2일</p>

        <div className="space-y-10 text-slate-300 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-white mb-3">제1조 (목적)</h2>
            <p>
              이 약관은 Loviq AI(이하 "서비스")가 제공하는 AI 연애 코칭 서비스의 이용 조건 및
              절차, 서비스 이용자와 서비스 운영자의 권리·의무 및 책임사항, 기타 필요한 사항을
              규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">제2조 (서비스 소개)</h2>
            <p>
              Loviq AI는 인공지능(AI) 기술을 활용하여 연애 관련 조언과 분석을 제공하는
              서비스입니다. 서비스는 성인 남성을 대상으로 하며, 다음의 기능을 제공합니다.
            </p>
            <ul className="mt-3 list-disc list-inside text-slate-400 space-y-1">
              <li>AI 1:1 연애 상담</li>
              <li>상대방 메시지 심리 분석</li>
              <li>호감도 및 관계 신호 분석</li>
              <li>연애 위기 대응 전략 제공</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">제3조 (이용 자격)</h2>
            <ul className="list-disc list-inside text-slate-400 space-y-1">
              <li>만 19세 이상의 성인만 서비스를 이용할 수 있습니다.</li>
              <li>서비스 가입 시 만 19세 이상임에 동의한 것으로 간주합니다.</li>
              <li>타인의 정보를 도용하거나 허위 정보로 가입한 경우 서비스 이용이 제한될 수 있습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">제4조 (계정 및 보안)</h2>
            <ul className="list-disc list-inside text-slate-400 space-y-1">
              <li>이용자는 자신의 아이디와 비밀번호를 안전하게 관리할 책임이 있습니다.</li>
              <li>계정 정보 도용 또는 보안 문제 발생 시 즉시 서비스에 알려야 합니다.</li>
              <li>타인에게 계정을 양도하거나 대여할 수 없습니다.</li>
              <li>아이디는 영문, 숫자, 언더스코어(_) 조합의 4~20자로 구성되어야 합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">제5조 (서비스 이용 제한)</h2>
            <p>다음의 행위는 금지되며, 위반 시 서비스 이용이 제한될 수 있습니다.</p>
            <ul className="mt-3 list-disc list-inside text-slate-400 space-y-1">
              <li>불법적인 목적으로 서비스를 이용하는 행위</li>
              <li>타인의 개인정보를 무단으로 수집하거나 악용하는 행위</li>
              <li>서비스의 운영을 방해하는 행위 (해킹, 스팸 등)</li>
              <li>미성년자가 서비스를 이용하는 행위</li>
              <li>서비스 내 AI 응답을 악의적 목적(사기, 범죄 등)에 활용하는 행위</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">제6조 (AI 서비스 면책 사항)</h2>
            <div className="bg-slate-800/50 border border-red-500/20 rounded-xl p-5">
              <ul className="list-disc list-inside text-slate-400 space-y-2 text-sm">
                <li>서비스가 제공하는 AI 조언은 <span className="text-white font-semibold">참고 목적</span>으로만 제공되며, 전문 상담사의 조언을 대체하지 않습니다.</li>
                <li>AI 응답의 정확성, 완전성을 보장하지 않으며, AI 조언을 따른 결과에 대해 서비스는 책임을 지지 않습니다.</li>
                <li>중요한 대인 관계 결정은 반드시 본인의 판단과 필요시 전문가의 도움을 받아 결정하시기 바랍니다.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">제7조 (서비스 이용 요금)</h2>
            <p>
              서비스는 현재 무료로 제공됩니다. 다만, 일일 AI 상담 횟수에 제한이 있을 수 있으며,
              향후 유료 기능이 추가될 경우 사전에 공지합니다.
              서비스 내 광고가 게재될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">제8조 (서비스 변경 및 중단)</h2>
            <p>
              서비스는 사전 공지 없이 서비스의 일부 또는 전체를 변경, 중단할 수 있습니다.
              서비스 중단으로 인한 손해에 대해 고의 또는 중과실이 없는 한 책임을 지지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">제9조 (개인정보 보호)</h2>
            <p>
              서비스의 개인정보 수집 및 이용에 관한 사항은 별도의{" "}
              <button
                onClick={() => window.open("/privacy", "_blank")}
                className="text-red-400 hover:text-red-300 underline"
              >
                개인정보처리방침
              </button>
              에 따릅니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">제10조 (준거법 및 관할)</h2>
            <p>
              이 약관은 대한민국 법률에 따라 해석 및 적용되며, 서비스와 이용자 간에 발생하는
              분쟁은 대한민국 법원을 관할 법원으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">부칙</h2>
            <p className="text-slate-400">이 약관은 2026년 3월 2일부터 시행합니다.</p>
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

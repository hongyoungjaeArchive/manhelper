import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    nickname: "",
    relationshipType: "dating" as const,
    partnerName: "",
    startDate: "",
    lastMetDate: "",
    lastConflictDate: "",
    contactFrequency: 7,
    notes: "",
  });

  const profileUpsert = trpc.profile.upsert.useMutation();

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.nickname) {
        toast.error("닉네임을 입력해주세요");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.partnerName) {
        toast.error("상대방 이름을 입력해주세요");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      // 최종 저장
      try {
        const dataToSave = {
          ...formData,
          startDate: formData.startDate ? new Date(formData.startDate) : undefined,
          lastMetDate: formData.lastMetDate ? new Date(formData.lastMetDate) : undefined,
          lastConflictDate: formData.lastConflictDate ? new Date(formData.lastConflictDate) : undefined,
          onboardingCompleted: true,
        };
        
        await profileUpsert.mutateAsync(dataToSave);
        toast.success("온보딩이 완료되었습니다!");
        setLocation("/dashboard");
      } catch (error) {
        toast.error("오류가 발생했습니다");
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-red-500" : "bg-slate-700"
                }`}
              />
            ))}
          </div>
          <p className="text-slate-400 text-sm mt-2">
            Step {step} of 3
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  먼저 당신을 소개해주세요
                </h2>
                <p className="text-slate-400">
                  Loviq AI가 더 정확한 조언을 제공하기 위해 필요한 정보입니다.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  닉네임
                </label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) =>
                    setFormData({ ...formData, nickname: e.target.value })
                  }
                  placeholder="닉네임을 입력하세요"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  관계 유형
                </label>
                <select
                  value={formData.relationshipType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      relationshipType: e.target.value as any,
                    })
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                >
                  <option value="dating">연애 중</option>
                  <option value="crush">썸</option>
                  <option value="longDistance">장거리 연애</option>
                  <option value="newlywed">신혼</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  상대방에 대해 알려주세요
                </h2>
                <p className="text-slate-400">
                  상대방의 정보를 입력하면 더 맞춤형 조언을 받을 수 있습니다.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  상대방 이름
                </label>
                <input
                  type="text"
                  value={formData.partnerName}
                  onChange={(e) =>
                    setFormData({ ...formData, partnerName: e.target.value })
                  }
                  placeholder="상대방 이름을 입력하세요"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  만난 날짜 (선택)
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  마지막 갈등 날짜 (선택)
                </label>
                <input
                  type="date"
                  value={formData.lastConflictDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lastConflictDate: e.target.value,
                    })
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  관계 패턴을 알려주세요
                </h2>
                <p className="text-slate-400">
                  마지막 단계입니다. 관계의 패턴을 입력하면 더 정확한 분석이 가능합니다.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  주당 연락 횟수
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.contactFrequency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactFrequency: parseInt(e.target.value),
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-white font-medium w-12">
                    {formData.contactFrequency}회
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  추가 노트 (선택)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="관계에 대해 추가로 알려주고 싶은 사항이 있으면 입력해주세요"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 h-24 resize-none"
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                이전
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={profileUpsert.isPending}
              className="flex-1"
            >
              {step === 3 ? "완료" : "다음"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

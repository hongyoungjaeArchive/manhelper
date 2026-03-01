import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { data: profile } = trpc.profile.get.useQuery();
  const profileUpsert = trpc.profile.upsert.useMutation();
  
  const [formData, setFormData] = useState({
    nickname: profile?.nickname || "",
    relationshipType: profile?.relationshipType || "dating",
    partnerName: profile?.partnerName || "",
    startDate: profile?.startDate ? new Date(profile.startDate).toISOString().split('T')[0] : "",
    lastMetDate: profile?.lastMetDate ? new Date(profile.lastMetDate).toISOString().split('T')[0] : "",
    lastConflictDate: profile?.lastConflictDate ? new Date(profile.lastConflictDate).toISOString().split('T')[0] : "",
    contactFrequency: profile?.contactFrequency || 7,
    notes: profile?.notes || "",
  });

  const handleSave = async () => {
    try {
      const dataToSave = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        lastMetDate: formData.lastMetDate ? new Date(formData.lastMetDate) : undefined,
        lastConflictDate: formData.lastConflictDate ? new Date(formData.lastConflictDate) : undefined,
      };
      
      await profileUpsert.mutateAsync(dataToSave);
      toast.success("프로필이 저장되었습니다!");
    } catch (error) {
      toast.error("오류가 발생했습니다");
    }
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
          <h1 className="text-2xl font-bold text-white">프로필 관리</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
          <div className="space-y-6">
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
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                만난 날짜
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
                마지막 만난 날짜
              </label>
              <input
                type="date"
                value={formData.lastMetDate}
                onChange={(e) =>
                  setFormData({ ...formData, lastMetDate: e.target.value })
                }
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                마지막 갈등 날짜
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
                추가 노트
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 h-24 resize-none"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setLocation("/dashboard")}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleSave}
                disabled={profileUpsert.isPending}
                className="flex-1"
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

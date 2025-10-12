"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Mode = "login" | "signup";
type Hemisphere = "north" | "south";

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [hemisphere, setHemisphere] = useState<Hemisphere>("north");
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    const trimmed = username.trim();
    if (!trimmed) return;

    setLoading(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const body =
      mode === "login" ? { username: trimmed } : { username: trimmed, hemisphere };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.ok) {
        alert(data.error || (mode === "login" ? "로그인 실패" : "회원가입 실패"));
        setLoading(false);
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/list";
    } catch (err) {
      console.error(err);
      alert("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [username, hemisphere, mode]);

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 backdrop-blur p-5 shadow-sm">
        <div className="flex flex-col gap-3">
          {/* 아이디 */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">아이디</label>
            <Input
              placeholder="한글 또는 영어로 입력하세요"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={loading}
            />
          </div>

          {/* 회원가입에서만 반구 선택 */}
          {mode === "signup" && (
            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted-foreground">반구 선택</label>
              <Select
                value={hemisphere}
                onValueChange={(v) => setHemisphere(v as Hemisphere)}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="반구를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="north">북반구</SelectItem>
                  <SelectItem value="south">남반구</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 액션 */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={loading || username.trim().length === 0}
          >
            {loading
              ? "처리 중..."
              : mode === "login"
                ? "로그인"
                : "회원가입"}
          </Button>

          <Button
            variant="link"
            className="w-full text-sm"
            type="button"
            onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
            disabled={loading}
          >
            {mode === "login" ? "회원가입으로 이동" : "로그인으로 이동"}
          </Button>
        </div>
      </div>
    </div>
  );
}

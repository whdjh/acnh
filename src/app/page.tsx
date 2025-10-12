"use client";

import { useState } from "react";

export default function HomePage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [hemisphere, setHemisphere] = useState("north");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!username.trim()) {
      alert("아이디를 입력해주세요.");
      return;
    }

    setLoading(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const body =
      mode === "login" ? { username } : { username, hemisphere };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.ok) {
        alert(data.error || "로그인 실패");
        setLoading(false);
        return;
      }

      // ✅ 로그인 또는 회원가입 성공 시 user 저장
      localStorage.setItem("user", JSON.stringify(data.user));

      // ✅ 강제 리디렉션
      window.location.href = "/list";
    } catch (err) {
      console.error(err);
      alert("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-xs mx-auto mt-20">
      <h1 className="text-xl font-bold text-center">
        모동숲 도감 로그인
      </h1>

      <input
        className="border p-2 rounded"
        placeholder="아이디 입력"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      {mode === "signup" && (
        <select
          className="border p-2 rounded"
          value={hemisphere}
          onChange={(e) => setHemisphere(e.target.value)}
        >
          <option value="north">북반구</option>
          <option value="south">남반구</option>
        </select>
      )}

      <button
        className="border p-2 rounded bg-blue-500 text-white disabled:opacity-50"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading
          ? "처리 중..."
          : mode === "login"
            ? "로그인"
            : "회원가입"}
      </button>

      <button
        className="text-sm text-blue-500"
        onClick={() =>
          setMode(mode === "login" ? "signup" : "login")
        }
      >
        {mode === "login"
          ? "회원가입으로 이동"
          : "로그인으로 이동"}
      </button>
    </div>
  );
}

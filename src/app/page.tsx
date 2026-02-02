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

interface AdItem {
  href: string;
  src: string;
  alt: string;
}

// ─────────────────────────────────────────────────────────────
// 광고 데이터 (6개) — 하단 6열로 렌더
// ─────────────────────────────────────────────────────────────
const TOP_ADS: AdItem[] = [
  {
    href: "https://link.coupang.com/a/cV8jpN",
    src: "https://img1a.coupangcdn.com/image/affiliate/banner/82e9ce68c92df2f94cfb2408217b017c@2x.jpg",
    alt: "[Triton] 8bitdo 팔비또 얼티메이트2 무선 게임패드 컨트롤러",
  },
  {
    href: "https://link.coupang.com/a/cV8kcq",
    src: "https://image5.coupangcdn.com/image/affiliate/banner/4f93a8ea6dae16223f31bd92d8b389ee@2x.jpg",
    alt: "[닌텐도] NS2 닌텐도 스위치2 (Switch2)",
  },
  {
    href: "https://link.coupang.com/a/cV8li1",
    src: "https://image8.coupangcdn.com/image/affiliate/banner/995ba842cae0de3f8ffb0c4d46f4d68c@2x.jpg",
    alt: "닌텐도 스위치 모여봐요 동물의 숲 한국어",
  },
];

const BOTTOM_ADS: AdItem[] = [
  {
    href: "https://link.coupang.com/a/cV8kzF",
    src: "https://image9.coupangcdn.com/image/affiliate/banner/5af98c5e37d2ddab8bf0016b77af77d6@2x.jpg",
    alt: "지니비 스위치2 무반사 액정보호필름",
  },
  {
    href: "https://link.coupang.com/a/cV8kOF",
    src: "https://img1a.coupangcdn.com/image/affiliate/banner/12fcdd3e6d9a5200191a2e388d173a29@2x.jpg",
    alt: "스위치 OLED 저반사 AR 액정보호필름 2P",
  },
  {
    href: "https://link.coupang.com/a/cV8lZ0",
    src: "https://img4c.coupangcdn.com/image/affiliate/banner/02c77137d92856147c98a23d68baa78a@2x.jpg",
    alt: "모동숲 해피홈 파라다이스 DLC",
  },
];

// 하단에 6개 표시
const ALL_ADS: AdItem[] = [...TOP_ADS, ...BOTTOM_ADS];

// ─────────────────────────────────────────────────────────────
// 6열 광고 그리드 (맨 하단)
// ─────────────────────────────────────────────────────────────
function AdGrid6({ items }: { items: AdItem[] }) {
  return (
    <div className="mx-auto w-full max-w-5xl py-3 grid grid-cols-6 gap-2">
      {items.map((ad, i) => (
        <a
          key={i}
          href={ad.href}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          referrerPolicy="unsafe-url"
          className="rounded-md ring-1 ring-white/10 hover:ring-white/20 transition-opacity opacity-85 hover:opacity-100"
          aria-label={ad.alt}
        >
          <img
            src={ad.src}
            alt={ad.alt}
            loading="lazy"
            className="block w-full h-28 sm:h-32 object-contain rounded-[8px] bg-white/5"
          />
        </a>
      ))}
    </div>
  );
}

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
    const body = mode === "login" ? { username: trimmed } : { username: trimmed, hemisphere };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.ok) {
        setLoading(false);
        return;
      }
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.href = "/list";
    } catch (err) {
      console.error(err);
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
    // 상단 공지, 중앙 카드, 하단 광고(6열)
    <div className="min-h-[calc(100dvh-4rem)] flex flex-col">
      {/* 상단 제휴 공지 */}
      <header className="w-full px-4 pt-4">
        <div className="mx-auto w-full max-w-3xl rounded-xl bg-red-600 text-black text-center text-xs sm:text-sm font-medium px-3 py-1.5">
          이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
        </div>
      </header>
      {/* 중앙 카드 영역: 세로·가로 센터 */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 backdrop-blur p-5 shadow-sm">
          <div className="flex flex-col gap-3">
            {/* 아이디 */}
            <label className="text-sm text-muted-foreground">아이디</label>
            <Input
              placeholder="한글 또는 영어로 입력하세요"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={onKeyDown}
            />
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
              {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
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
      </main>

      {/* 하단 광고 (6열, 전체 폭) */}
      <footer className="w-full px-4 pb-3">
        <AdGrid6 items={ALL_ADS} />
      </footer>
    </div>
  );
}
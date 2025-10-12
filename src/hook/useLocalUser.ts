"use client";

import { useEffect, useState } from "react";

type User = { id: number; username: string; hemisphere: "north" | "south" };

export function useLocalUser() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      window.location.href = "/";
      return;
    }
    try {
      const u = JSON.parse(raw);
      setUser(u);
    } catch {
      localStorage.removeItem("user");
      window.location.href = "/";
    }
  }, []);

  return user;
}

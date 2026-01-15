"use client";

import { useEffect, useState } from "react";

interface User {
  id: number;
  username: string;
  hemisphere: "north" | "south";
}

const USER_STORAGE_KEY = "user";
const LOGIN_PAGE_PATH = "/";

/**
 * localStorage에서 사용자 정보를 가져오는 훅
 * 
 * 사용자 정보가 없거나 파싱에 실패하면 로그인 페이지로 리다이렉트합니다.
 * 
 * @returns 사용자 정보 객체 또는 null
 */
export function useLocalUser(): User | null {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      window.location.href = LOGIN_PAGE_PATH;
      return;
    }

    try {
      const parsedUser = JSON.parse(raw) as User;
      setUser(parsedUser);
    } catch (error) {
      console.error("Failed to parse user data from localStorage:", error);
      localStorage.removeItem(USER_STORAGE_KEY);
      window.location.href = LOGIN_PAGE_PATH;
    }
  }, []);

  return user;
}

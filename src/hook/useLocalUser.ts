"use client"

import { useEffect, useState } from "react"

const USER_STORAGE_KEY = "user"
const LOGIN_PAGE_PATH = "/"

 // localStorage에서 사용자 정보를 가져오는 훅
export function useLocalUser(): { id: number; username: string; hemisphere: "north" | "south" } | null {
  const [user, setUser] = useState<{ id: number; username: string; hemisphere: "north" | "south" } | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    if (!raw) {
      window.location.href = LOGIN_PAGE_PATH
      return
    }

    try {
      const parsedUser = JSON.parse(raw) as { id: number; username: string; hemisphere: "north" | "south" }
      setUser(parsedUser)
    } catch (error) {
      console.error("Failed to parse user data from localStorage:", error)
      localStorage.removeItem(USER_STORAGE_KEY)
      window.location.href = LOGIN_PAGE_PATH
    }
  }, [])

  return user
}

# 탐슬도감 - 운영 가이드

## 프로젝트 개요
- **이름**: 탐슬도감 (모여봐요 동물의 숲 도감 웹앱)
- **기술스택**: Next.js 15, React 18, Drizzle ORM, Supabase, TanStack Query, Zustand, Tailwind CSS
- **URL**: https://acnh-gules.vercel.app

## 프로젝트 구조
```
src/
├── app/
│   ├── api/
│   │   ├── items/[category]/route.ts  # 아이템 API
│   │   ├── caught/                     # 잡은 아이템 API
│   │   └── auth/                       # 인증 API
│   ├── list/page.tsx                   # 도감 페이지
│   └── page.tsx                        # 홈 페이지
├── components/
│   ├── list/
│   │   ├── ItemsGrid.tsx
│   │   └── ListHeader.tsx
│   └── ui/                            # shadcn/ui
├── hook/
│   ├── useAcnhItems.ts
│   ├── useCaughtItems.ts
│   └── useLocalUser.ts
├── lib/
│   ├── time.ts                        # 시간 유틸
│   ├── localization.ts                # 한글화
│   └── db.ts                          # DB 연결
├── db/schema.ts                       # Drizzle 스키마
└── types/acnh.ts                      # 타입 정의
```

## 핵심 규칙 (표지판)

### 반드시 지켜야 할 것
- 작업 전 `pnpm build` 확인
- 작업 후 `pnpm build` 확인
- 작업 후 `pnpm test` 확인 (테스트 있는 경우)
- 하나의 작업 완료 시 git commit
- TypeScript strict mode 준수
- 기존 API 응답 형식 유지

### 절대 하지 말 것
- 새로운 의존성 추가 (필수 아닌 경우)
- DB 스키마 변경
- .env 파일 수정
- UI 변경 (명시적 요청 없는 한)
- 빌드 실패 상태로 커밋

## 작업 흐름
1. `IMPLEMENTATION_PLAN.md` 확인 → 다음 작업 선택
2. 작업 수행
3. `pnpm build && pnpm test` 검증
4. 성공 시 커밋 + `IMPLEMENTATION_PLAN.md` 업데이트
5. 실패 시 롤백 + 문제점 기록

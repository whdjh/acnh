# Ralph Wiggum Prompt - 탐슬도감 리팩토링

## 프로젝트 개요
- **프로젝트명**: 탐슬도감 (모여봐요 동물의 숲 도감 웹앱)
- **기술스택**: Next.js 15, React 18, Drizzle ORM, Supabase, TanStack Query, Zustand, Tailwind CSS
- **URL**: https://acnh-gules.vercel.app

## 현재 상태
- 클라이언트에서 필터링/정렬 처리 중 (`src/app/list/page.tsx`)
- `"use client"` 컴포넌트가 많아 초기 번들 사이즈 큼
- 테스트 코드 없음

## 작업 목표 (우선순위 순)

### 1. 서버 사이드 필터링/정렬 이관
- [ ] `/api/items/[category]` API에 필터/정렬 파라미터 추가
  - `month`, `hour`, `habitat`, `search`, `sort` 쿼리 파라미터
- [ ] 클라이언트의 `useMemo` 필터링 로직을 서버로 이동
- [ ] DB 쿼리 최적화 (인덱스 활용)

### 2. Lighthouse 점수 향상
- [ ] `"use client"` 최소화 - 가능한 Server Component로 전환
- [ ] 이미지 최적화 (적절한 sizes, priority 설정)
- [ ] 번들 사이즈 분석 및 최적화
- [ ] Core Web Vitals 개선 (LCP, FID, CLS)

### 3. 코드 정리 및 성능 최적화
- [ ] 불필요한 re-render 제거
- [ ] 중복 코드 제거
- [ ] 타입 정의 정리

### 4. 테스트 코드 작성
- [ ] Jest 설정 확인/개선
- [ ] API 라우트 유닛 테스트
- [ ] 유틸 함수 테스트 (`lib/time.ts`, `lib/localization.ts`)
- [ ] 커버리지 70% 이상 목표

---

## 표지판 (가이드라인)

### DO (해야 할 것)
- 작업 전 `pnpm build`로 빌드 확인
- 작업 후 `pnpm build`로 빌드 성공 확인
- 작업 후 `pnpm test`로 테스트 통과 확인
- 하나의 작업 완료 후 git commit
- 기존 API 응답 형식 유지 (하위 호환성)
- TypeScript strict mode 준수

### DON'T (하지 말 것)
- 새로운 의존성 추가하지 않기 (필수적인 경우 제외)
- 기존 기능 변경하지 않기
- .env 파일 수정하지 않기
- DB 스키마 변경하지 않기
- 사용자에게 보이는 UI 변경하지 않기

### 작업 순서
1. 먼저 현재 코드를 읽고 이해
2. 변경 계획 수립
3. 작은 단위로 변경
4. 빌드 & 테스트 확인
5. 커밋

---

## 주요 파일 구조

```
src/
├── app/
│   ├── api/
│   │   ├── items/[category]/route.ts  # 아이템 API (필터링 이관 대상)
│   │   ├── caught/                     # 잡은 아이템 API
│   │   └── auth/                       # 인증 API
│   ├── list/page.tsx                   # 도감 페이지 (리팩토링 대상)
│   └── page.tsx                        # 홈 페이지
├── components/
│   ├── list/
│   │   ├── ItemsGrid.tsx              # 아이템 그리드
│   │   └── ListHeader.tsx             # 헤더 (필터 UI)
│   └── ui/                            # shadcn/ui 컴포넌트
├── hook/
│   ├── useAcnhItems.ts                # 아이템 데이터 훅
│   ├── useCaughtItems.ts              # 잡은 아이템 훅
│   └── useLocalUser.ts                # 사용자 정보 훅
├── lib/
│   ├── time.ts                        # 시간 유틸 (테스트 대상)
│   ├── localization.ts                # 한글화 맵
│   └── db.ts                          # DB 연결
├── db/schema.ts                       # Drizzle 스키마
└── types/acnh.ts                      # 타입 정의
```

---

## 체크포인트

작업 완료 후 다음을 확인:

```bash
# 빌드 성공
pnpm build

# 테스트 통과
pnpm test

# 린트 통과
pnpm lint

# Lighthouse 점수 (선택)
# Chrome DevTools > Lighthouse > Generate report
```

---

## 메모

- 현재 `list/page.tsx`의 `displayed` useMemo가 4단계 필터링 수행 중
- API는 `only=1` 파라미터로 월 필터만 서버에서 처리 가능
- fossil 카테고리는 월/시간 개념 없음

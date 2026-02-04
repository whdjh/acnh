# Implementation Plan

## 현재 상태
- Phase 1 완료 ✓
- Phase 1.5 완료 ✓ (API 타입 중앙화)
- Phase 2 대기 중

---

## Phase 1: 서버 사이드 필터링 이관
> Spec: `specs/server-side-filtering.md`

### 1-A. 시간(hour) 필터 이관
- [x] Task 1.1: API에 `hour` 파라미터 추가
  - 파일: `src/app/api/items/[category]/route.ts`
  - 변경: URL 파라미터 파싱 + hoursMask 기반 필터링 로직
- [x] Task 1.2: `hour` 필터 클라이언트 교체
  - 파일: `src/hook/useAcnhItems.ts`, `src/app/list/page.tsx`
  - 변경: 훅에서 hour 전달 + 클라이언트 시간 필터링 제거

### 1-B. 서식지(habitat) 필터 이관
- [x] Task 1.3: API에 `habitat` 파라미터 추가
  - 파일: `src/app/api/items/[category]/route.ts`
  - 변경: location 문자열 → habitat 분류 함수 + 필터링
- [x] Task 1.4: `habitat` 필터 클라이언트 교체
  - 파일: `src/hook/useAcnhItems.ts`, `src/app/list/page.tsx`
  - 변경: 훅에서 habitat 전달 + 클라이언트 서식지 필터링 제거

### 1-C. 검색(search) 필터 이관
- [x] Task 1.5: API에 `search` 파라미터 추가
  - 파일: `src/app/api/items/[category]/route.ts`
  - 변경: name/originalName 검색 필터링
- [x] Task 1.6: `search` 필터 클라이언트 교체
  - 파일: `src/hook/useAcnhItems.ts`, `src/app/list/page.tsx`
  - 변경: 훅에서 search 전달 + 클라이언트 검색 필터링 제거

### 1-D. 정렬(sort) 이관
- [x] Task 1.7: API에 `sort` 파라미터 추가
  - 파일: `src/app/api/items/[category]/route.ts`
  - 변경: 가격 기준 정렬 (priceDesc, priceAsc)
- [x] Task 1.8: `sort` 클라이언트 교체
  - 파일: `src/hook/useAcnhItems.ts`, `src/app/list/page.tsx`
  - 변경: 훅에서 sort 전달 + 클라이언트 정렬 제거
  - 주의: 미포획/포획 그룹 정렬은 클라이언트 유지

---

## Phase 1.5: API 타입 중앙화 ✓
> 모든 API 관련 타입을 `src/types/acnh.ts`에서 관리

- [x] 공통 타입 추가: `Habitat`, `SortKey`, `Hemisphere`
- [x] API 응답 타입 추가: `ApiItemsResponse`, `ApiCaughtResponse`, `ApiToggleResponse`
- [x] 각 파일에서 로컬 타입 제거 → import로 교체

---

## Phase 2: Lighthouse 최적화
> Spec: `specs/lighthouse-optimization.md`

- [x] Task 2.1: 현재 Lighthouse 점수 측정 및 기록
- [x] Task 2.2: 번들 분석 및 최적화 포인트 파악
- [x] Task 2.3: Server Component 전환 가능한 부분 식별 및 적용
- [x] Task 2.4: 이미지 최적화 (sizes, priority 검토)
- [ ] Task 2.5: 최종 Lighthouse 점수 측정 및 비교

---

## 완료된 작업 로그
<!-- 완료된 작업은 여기로 이동 -->

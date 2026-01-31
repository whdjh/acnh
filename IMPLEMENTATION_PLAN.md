# Implementation Plan

## 현재 상태
- Phase 1 진행 중

---

## Phase 1: 서버 사이드 필터링 이관
> Spec: `specs/server-side-filtering.md`

- [ ] Task 1.1: API에 `hour` 파라미터 추가
  - 파일: `src/app/api/items/[category]/route.ts`
  - 변경: URL 파라미터 파싱 + hoursMask 기반 필터링 로직

- [ ] Task 1.2: API에 `habitat` 파라미터 추가
  - 파일: `src/app/api/items/[category]/route.ts`
  - 변경: location 문자열 → habitat 분류 함수 + 필터링

- [ ] Task 1.3: API에 `search` 파라미터 추가
  - 파일: `src/app/api/items/[category]/route.ts`
  - 변경: name/originalName 검색 필터링

- [ ] Task 1.4: API에 `sort` 파라미터 추가
  - 파일: `src/app/api/items/[category]/route.ts`
  - 변경: 가격 기준 정렬 (priceDesc, priceAsc)

- [ ] Task 1.5: `useAcnhItems` 훅 수정
  - 파일: `src/hook/useAcnhItems.ts`
  - 변경: 새 파라미터(hour, habitat, search, sort) 전달

- [ ] Task 1.6: `list/page.tsx` 클라이언트 필터링 제거
  - 파일: `src/app/list/page.tsx`
  - 변경: useMemo 필터링 로직 제거, 서버 데이터 직접 사용
  - 주의: 미포획/포획 그룹 정렬은 클라이언트 유지

---

## Phase 2: Lighthouse 최적화
> Spec: `specs/lighthouse-optimization.md`

- [ ] Task 2.1: 현재 Lighthouse 점수 측정 및 기록
- [ ] Task 2.2: 번들 분석 및 최적화 포인트 파악
- [ ] Task 2.3: Server Component 전환 가능한 부분 식별 및 적용
- [ ] Task 2.4: 이미지 최적화 (sizes, priority 검토)
- [ ] Task 2.5: 최종 Lighthouse 점수 측정 및 비교

---

## Phase 3: 테스트 코드 작성
> Spec: `specs/test-coverage.md`

- [ ] Task 3.1: Jest 설정 확인/개선
- [ ] Task 3.2: `lib/time.ts` 테스트 작성
- [ ] Task 3.3: `lib/localization.ts` 테스트 작성
- [ ] Task 3.4: API 라우트 테스트 작성
- [ ] Task 3.5: 커버리지 70% 달성 확인

---

## 완료된 작업 로그
<!-- 완료된 작업은 여기로 이동 -->

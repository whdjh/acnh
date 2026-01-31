# 테스트 코드 작성

## 목표
- 테스트 커버리지 70% 이상
- 핵심 유틸 함수 및 API 테스트

## 테스트 대상

### 1. 유틸 함수 (lib/)
- `lib/time.ts`
  - `parseClockToHour`
  - `rangeToHours`
  - `stringTimesToHourSet`
  - `normalizeTimesToHourSet`
  - `isAvailableAtHour`
  - `formatTimesForMonth`

- `lib/localization.ts`
  - `nameKoMap` 매핑 테스트
  - `locationKoMap` 매핑 테스트

### 2. API 라우트
- `api/items/[category]`
  - 카테고리별 아이템 조회
  - 필터 파라미터 동작
  - 에러 케이스

- `api/caught`
  - 잡은 아이템 조회/토글

### 3. 훅 (선택)
- `useAcnhItems`
- `useCaughtItems`

## Jest 설정
- 파일: `jest.config.js` (없으면 생성)
- 실행: `pnpm test`

## 테스트 파일 위치
```
src/
├── lib/
│   ├── time.ts
│   └── __tests__/
│       └── time.test.ts
├── app/api/
│   └── items/[category]/
│       ├── route.ts
│       └── route.test.ts
```

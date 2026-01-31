# 서버 사이드 필터링/정렬 이관

## 배경
현재 클라이언트(`list/page.tsx`)에서 4단계 필터링을 수행 중:
1. 월/시간 필터 (`isAvailableAtHour`)
2. 서식지 필터 (물고기 전용)
3. 검색 필터
4. 가격 정렬

이를 서버로 이관하여 초기 로딩 성능을 개선합니다.

## 현재 API
- 파일: `src/app/api/items/[category]/route.ts`
- 파라미터: `month`, `hemi`, `only`
- `only=1`이면 해당 월에 존재하는 아이템만 반환

## 요구사항

### API 파라미터 추가
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `hour` | number (0-23) | 시간 필터 |
| `habitat` | string | 서식지 필터 (물고기 전용): all, pond, river, clifftop, riverMouth, pier, sea |
| `search` | string | 이름 검색 (한글/영어) |
| `sort` | string | 정렬: priceDesc, priceAsc |

### 서버 로직 추가
1. `hour` 필터: `hoursMask` 비트마스크로 해당 시간 확인
2. `habitat` 필터: `location` 필드 파싱
3. `search` 필터: `name`, `originalName` 검색
4. `sort`: 가격 기준 정렬

### 클라이언트 수정
- `useAcnhItems` 훅에 새 파라미터 전달
- `list/page.tsx`의 useMemo 필터링 제거
- 단, **미포획/포획 그룹 정렬**은 클라이언트 유지 (caughtSet 필요)

## 하위 호환성
- 기존 파라미터만 사용 시 동일하게 동작해야 함
- 새 파라미터는 모두 optional

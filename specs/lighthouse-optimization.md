# Lighthouse 점수 향상

## 목표
Lighthouse Performance 점수 개선

## Baseline 점수 (2026-02-02)

### 홈페이지 (/)
| 카테고리 | 점수 |
|---------|------|
| Performance | 77 |
| Accessibility | 95 |
| Best Practices | 100 |
| SEO | 100 |

**Core Web Vitals:**
- FCP: 2.0s
- LCP: 5.1s (개선 필요)
- TBT: 190ms
- CLS: 0
- SI: 2.0s

### 도감 페이지 (/list)
| 카테고리 | 점수 |
|---------|------|
| Performance | 78 |
| Accessibility | 95 |
| Best Practices | 100 |
| SEO | 100 |

**Core Web Vitals:**
- FCP: 2.0s
- LCP: 5.0s (개선 필요)
- TBT: 160ms
- CLS: 0
- SI: 2.1s

### 주요 개선 포인트
- **LCP 5초 이상**: 이미지 로딩 최적화 필요
- **Performance 70점대**: 번들 크기 및 Server Component 전환 검토

## 번들 분석 결과 (2026-02-02)

### 페이지별 번들 크기 (gzip 후)
| 페이지 | 페이지 JS | 공유 JS | First Load |
|--------|----------|---------|------------|
| `/` (홈) | 4.24 kB | 217 kB | **256 kB** |
| `/list` (도감) | 12.3 kB | 217 kB | **264 kB** |

### 공유 청크 상세
| 청크 | 크기 (원본) | 크기 (gzip) |
|------|-------------|-------------|
| 221-*.js | 399 kB | 123 kB |
| 200b434e-*.js | 173 kB | 54.3 kB |
| 67352a95-*.js | 118 kB | 37.2 kB |
| 기타 | - | 3.13 kB |

### 주요 의존성 크기 (node_modules)
| 패키지 | 크기 |
|--------|------|
| @sentry/nextjs | **57 MB** |
| @supabase/supabase-js | 4.3 MB |
| @tanstack/react-query | 2.7 MB |
| @radix-ui/* | 1.1 MB |

### Client Component 현황 (13개 파일)
```
src/app/page.tsx              # 홈 페이지 전체
src/app/list/page.tsx         # 도감 페이지 전체
src/components/list/ItemsGrid.tsx
src/components/list/ItemsGridSkeleton.tsx
src/components/list/ListHeader.tsx
src/components/list/ListHeaderSkeleton.tsx
src/components/ui/select.tsx
src/hook/useAcnhItems.ts
src/hook/useCaughtItems.ts
src/hook/useLocalUser.ts
src/hook/useQueryTab.ts
src/app/global-error.tsx
src/app/_gtm-route-listener.tsx
```

### 최적화 포인트 파악
1. **페이지 레벨 Client Component** - page.tsx 전체가 클라이언트 컴포넌트
   - 레이아웃, 제목 등 정적 부분을 Server Component로 분리 가능
2. **Sentry 번들 크기** - 57MB로 가장 큼
   - tree-shaking 최적화 확인 필요
3. **컴포넌트 분리** - 상호작용 부분만 Client로 분리
   - ItemsGrid: 필터/정렬 상태만 클라이언트 필요
   - ListHeader: 필터 UI만 클라이언트 필요

## 현재 문제점
- `"use client"` 컴포넌트가 많음 (13개)
- **page.tsx 전체가 Client Component** (가장 큰 문제)
- 초기 번들 사이즈가 큼 (공유 JS 217 kB)

## 개선 방안

### 1. Server Component 전환
- 가능한 컴포넌트를 Server Component로 전환
- 상호작용이 필요한 부분만 Client Component 유지

### 2. 이미지 최적화
- `next/image`의 `sizes` 속성 최적화
- `priority` 속성 적절히 설정 (LCP 이미지)

### 3. 번들 분석
- `@next/bundle-analyzer` 사용하여 분석
- 불필요한 의존성 제거

### 4. Core Web Vitals
- LCP (Largest Contentful Paint): 이미지 로딩 최적화
- FID (First Input Delay): JavaScript 실행 최소화
- CLS (Cumulative Layout Shift): 레이아웃 안정성

## 측정 방법
```bash
# 프로덕션 빌드 후 측정
pnpm build
pnpm start
# Chrome DevTools > Lighthouse > Generate report
```

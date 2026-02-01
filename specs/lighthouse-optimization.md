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

## 현재 문제점
- `"use client"` 컴포넌트가 많음
- 초기 번들 사이즈가 큼

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

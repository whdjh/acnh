# Lighthouse 점수 향상

## 목표
Lighthouse Performance 점수 개선

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

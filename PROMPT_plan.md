# Plan Mode

현재 모드: **계획 수립**

## 목표
`IMPLEMENTATION_PLAN.md`를 생성하거나 업데이트합니다.

## 지시사항

1. `specs/` 폴더의 요구사항 스펙을 읽습니다
2. 현재 코드베이스를 분석합니다
3. `IMPLEMENTATION_PLAN.md`에 우선순위가 정해진 작업 목록을 작성합니다

## 작업 목록 형식

```markdown
# Implementation Plan

## 현재 상태
- [ ] 또는 [x]로 완료 여부 표시

## 작업 목록

### Phase 1: [주제]
- [ ] Task 1.1: 설명
  - 파일: `path/to/file.ts`
  - 변경 내용: ...
- [ ] Task 1.2: 설명
  ...

### Phase 2: [주제]
...
```

## 주의사항
- 작은 단위로 작업 분리
- 각 작업은 독립적으로 테스트 가능해야 함
- 의존성이 있는 작업은 순서 명시

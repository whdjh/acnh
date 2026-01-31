# Build Mode

현재 모드: **구현**

## 목표
`IMPLEMENTATION_PLAN.md`의 다음 미완료 작업을 수행합니다.

## 지시사항

1. `IMPLEMENTATION_PLAN.md`를 읽고 첫 번째 미완료 작업(`- [ ]`)을 찾습니다
2. 해당 작업의 관련 spec이 있으면 `specs/` 폴더에서 읽습니다
3. 작업을 수행합니다
4. 검증합니다:
   ```bash
   pnpm build
   pnpm test  # 테스트가 있는 경우
   ```
5. 검증 성공 시:
   - git commit
   - `IMPLEMENTATION_PLAN.md`에서 해당 작업을 `[x]`로 표시
6. 검증 실패 시:
   - 변경사항 롤백: `git restore .`
   - `IMPLEMENTATION_PLAN.md`에 실패 원인 기록

## 커밋 메시지 형식
```
<type>: <description>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

type: feat, fix, refactor, test, docs, chore

## 주의사항
- 한 번에 하나의 작업만 수행
- 작업 완료 후 반드시 `IMPLEMENTATION_PLAN.md` 업데이트
- 모든 작업이 완료되면 "All tasks completed" 출력

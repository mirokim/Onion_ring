# 🎯 Phase 2 리팩토링 준비 가이드

**상태**: Phase 1 ✅ 완료 | Phase 2 📋 준비 중  
**예상 시간**: 2-3시간  
**우선순위**: 🔴 높음

---

## Phase 2 목표

구조적 개선을 통해:
1. 대규모 컴포넌트 분할 (TopicInput.tsx)
2. 시스템 프롬프트 빌더 개선
3. 에러 하이드레이션
4. Zustand 선택자 최적화

---

## 📌 Phase 2 Task Breakdown

### 2.1 TopicInput.tsx 분할 (744줄 → 부분 컴포넌트화)

**현재 상태**:
- 파일: `src/components/TopicInput.tsx` (744줄)
- 문제: 너무 큼, 여러 책임
- 복잡도: 높음

**분할 계획**:
```
src/components/TopicInput/
├── TopicInput.tsx           (메인, 200줄)
├── DebateConfig.tsx         (토론 설정, 150줄)
├── RoleSelector.tsx         (역할 선택, 100줄)
├── FileUploader.tsx         (파일 업로드, 100줄)
├── PacingSelector.tsx       (페이싱 선택, 80줄)
└── hooks/
    └── useDebateConfig.ts   (상태 로직, 100줄)
```

**이점**:
- 각 컴포넌트 200줄 이하 (권장)
- 재사용성 증대
- 테스트 용이성 향상
- 유지보수성 개선

**Task**:
1. [ ] `DebateConfig` 컴포넌트 추출
2. [ ] `RoleSelector` 컴포넌트 추출
3. [ ] `FileUploader` 컴포넌트 추출
4. [ ] `PacingSelector` 컴포넌트 추출
5. [ ] `useDebateConfig` 커스텀 훅 추출
6. [ ] TopicInput 메인 파일 정리

---

### 2.2 System Prompt Builder Strategy 패턴

**현재 상태**:
- 파일: `src/ai/debateEngine.ts` (buildSystemPrompt, buildArtworkSystemPrompt)
- 문제: 모드별 switch 문, 중복된 텍스트

**개선 계획**:
```typescript
// 변경 전: switch 문 (85줄)
function buildSystemPrompt(config, provider) {
  switch (config.mode) {
    case 'roundRobin': ...
    case 'freeDiscussion': ...
    case 'roleAssignment': ...
    case 'battle': ...
    case 'artworkEval': ...
  }
}

// 변경 후: Strategy 패턴 (30줄)
interface PromptStrategy {
  build(config, provider): string
}

const strategies: Record<DiscussionMode, PromptStrategy> = {
  roundRobin: new RoundRobinStrategy(),
  freeDiscussion: new FreeDiscussionStrategy(),
  // ...
}
```

**파일 구조**:
```
src/ai/prompts/
├── base.ts                    (기본 프롬프트)
├── strategies/
│   ├── roundRobin.ts
│   ├── freeDiscussion.ts
│   ├── roleAssignment.ts
│   ├── battle.ts
│   └── artworkEval.ts
└── builder.ts                 (프롬프트 빌더)
```

**Task**:
1. [ ] PromptStrategy 인터페이스 정의
2. [ ] 각 모드별 Strategy 클래스 생성
3. [ ] debateEngine에서 Strategy 사용
4. [ ] 프롬프트 테스트

---

### 2.3 Error Boundary 추가

**현재 상태**:
- 에러 바운더리: 없음
- 문제: 컴포넌트 오류 시 전체 UI 크래시

**구현**:
```typescript
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // 로깅
    // UI 표시
  }

  render() {
    return this.state.hasError ? <ErrorFallback /> : this.props.children
  }
}
```

**위치**:
- `App.tsx` 메인 wrap
- DebateThread 컴포넌트 wrap
- Sidebar 섹션 wrap

**Task**:
1. [ ] ErrorBoundary 컴포넌트 생성
2. [ ] ErrorFallback UI 설계
3. [ ] App.tsx에 통합
4. [ ] 에러 로깅 연결 (Phase 3)

---

### 2.4 Zustand 선택자 최적화

**현재 상태**:
```typescript
// 비효율적 (모든 상태 변화에 리렌더링)
const status = useDebateStore((s) => s)  // ❌
const messages = useDebateStore((s) => s.messages)  // ✅

// 최적화 부족한 곳들
```

**개선 대상**:
- `ControlBar.tsx`: 여러 선택자 → 통합
- `TopicInput.tsx`: 큰 파일이므로 세분화
- `DebateThread.tsx`: 메시지 변화만 구독

**최적화 패턴**:
```typescript
// 세분화된 선택자
const status = useDebateStore((s) => s.status)
const messages = useDebateStore((s) => s.messages)
const currentRound = useDebateStore((s) => s.currentRound)

// 또는 useMemo로 감싸기
const roundInfo = useMemo(() => ({
  round: store.currentRound,
  maxRounds: store.config?.maxRounds || 3,
}), [store.currentRound, store.config?.maxRounds])
```

**Task**:
1. [ ] Zustand 선택자 가이드 작성
2. [ ] 각 컴포넌트의 선택자 검토
3. [ ] useMemo 추가 (필요시)
4. [ ] 성능 측정 (DevTools)

---

## 📋 체크리스트

### 시작 전
- [ ] Phase 1 REFACTORING_PHASE1_SUMMARY.md 읽기
- [ ] 새로운 utils 파일들 이해 (fileHandling, roleHelpers, constants)
- [ ] debateEngine 변경사항 검토

### Phase 2 실행
- [ ] 2.1 TopicInput 분할
- [ ] 2.2 Prompt Builder Strategy
- [ ] 2.3 Error Boundary
- [ ] 2.4 Zustand 최적화

### 빌드 및 테스트
- [ ] 타입 체크: `npm run build`
- [ ] 빌드 성공 확인
- [ ] 기본 기능 동작 확인
- [ ] 콘솔 에러 확인

### 완료
- [ ] REFACTORING_PHASE2_SUMMARY.md 작성
- [ ] Phase 3 준비

---

## 🔗 관련 파일

| 파일 | 영향도 | 난이도 |
|------|--------|--------|
| `src/components/TopicInput.tsx` | 🔴 높음 | 🟡 중간 |
| `src/ai/debateEngine.ts` | 🟡 중간 | 🟡 중간 |
| `src/components/App.tsx` | 🟢 낮음 | 🟢 낮음 |
| `src/components/ControlBar.tsx` | 🟡 중간 | 🟢 낮음 |
| `src/components/DebateThread.tsx` | 🟡 중간 | 🟢 낮음 |

---

## 💡 팁

1. **Git 브랜치**: 각 task마다 별도 브랜치 사용
   ```bash
   git checkout -b refactor/phase2-topicInput
   ```

2. **점진적 커밋**: 작은 단위로 자주 커밋
   ```bash
   git commit -m "refactor(topicInput): extract DebateConfig component"
   ```

3. **테스트 우선**: 변경 전 현재 기능 동작 확인

4. **롤백 준비**: 실패 시 쉽게 되돌릴 수 있도록 준비

---

## 📊 예상 시간

| Task | 예상 시간 | 실제 시간 | 상태 |
|------|----------|----------|------|
| 2.1 TopicInput 분할 | 1.0h | TBD | ⏳ |
| 2.2 Prompt Strategy | 0.8h | TBD | ⏳ |
| 2.3 Error Boundary | 0.5h | TBD | ⏳ |
| 2.4 Zustand 최적화 | 0.7h | TBD | ⏳ |
| **합계** | **3.0h** | TBD | ⏳ |

---

## 🚀 시작 명령

```bash
# Phase 2 새 브랜치 생성
git checkout -b refactor/phase2

# 의존성 확인
npm install

# 개발 서버 실행
npm run dev

# 타입 체크 (변경 후)
npm run build

# 완료 후 커밋
git add .
git commit -m "refactor(phase2): structural improvements

- Extract TopicInput sub-components
- Implement PromptBuilder Strategy pattern
- Add ErrorBoundary
- Optimize Zustand selectors"
```

---

## 📞 질문/문제

문제 발생 시:
1. 콘솔/터미널 에러 메시지 확인
2. 관련 파일의 주석/문서 읽기
3. Phase 1 가이드 참고
4. CODE_REVIEW.md 관련 섹션 확인

---

**준비 완료**: Phase 2로 진행하세요!  
**문서 마지막 업데이트**: 2026-03-01

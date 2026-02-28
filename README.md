# Onion Ring — Multi-AI Debate App

여러 AI가 실시간으로 토론하는 Android 앱입니다.
OpenAI, Anthropic (Claude), Google Gemini, xAI (Grok) 4개의 AI 제공자를 지원합니다.

---

## 주요 기능

- **라운드 로빈** — AI들이 순서대로 돌아가며 토론
- **자유 토론** — 제한 없이 자유롭게 의견 교환
- **역할 배정** — 각 AI에게 찬성/반대 등 역할 부여
- **결전모드** — 토론자 2명 + 심판 1명 구도
- **아트워크 평가** — 이미지를 첨부해 AI들에게 작품 평가 요청
- **토론 기록** — SQLite(sql.js)로 기기 내 저장, 히스토리 열람 가능
- **참고 자료** — 텍스트/이미지/PDF 파일 첨부 지원
- **사용자 개입** — 토론 중 메시지를 보내 AI들에게 질문/지시 가능
- **페이싱 제어** — 자동 딜레이 또는 수동 넘기기
- **마크다운 내보내기** — 토론 완료 후 `.md` 파일로 저장 (Android Documents 폴더)

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 19 + TypeScript + Vite 6 |
| 스타일 | Tailwind CSS v4 |
| 상태 관리 | Zustand v5 |
| DB | sql.js (SQLite WASM) + IndexedDB 영속화 |
| Android 래퍼 | Capacitor 8 |
| AI 호출 | fetch (OpenAI, Anthropic, Gemini, xAI REST API 직접 호출) |

---

## 개발 환경 준비

### 필수 도구

- Node.js 18+
- Android Studio (JDK 21 포함)
- Android SDK

### 설치

```bash
npm install
```

### 웹 개발 서버 실행

```bash
npm run dev
```

### Android APK 빌드

```bash
# 1. 웹 빌드
npx tsc -b --noEmit   # 타입 체크
npx vite build

# 2. Capacitor sync
npx cap sync android

# 3. Gradle APK 빌드
cd android
./gradlew assembleDebug
```

빌드 결과물: `android/app/build/outputs/apk/debug/app-debug.apk`

### APK 설치

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 사용 방법

1. **사이드바 → 설정**에서 사용할 AI 제공자의 API 키를 입력하고 활성화
2. 메인 화면에서 토론 주제 입력
3. 토론 모드, 참여 AI, 라운드 수 선택
4. **시작** 버튼 클릭

---

## 프로젝트 구조

```
src/
├── ai/
│   ├── debateEngine.ts       # 토론 진행 로직
│   ├── providers.ts          # AI API 호출 (OpenAI / Anthropic / Gemini / xAI)
│   └── prompts/              # 모드별 시스템 프롬프트 전략
├── components/
│   ├── TopicInput/           # 토론 설정 화면 (참여자, 역할, 페이싱 등)
│   ├── ControlBar.tsx        # 토론 중 제어 바
│   ├── DebateThread.tsx      # 메시지 스레드
│   ├── Sidebar.tsx           # 히스토리 및 설정
│   └── ...
├── db/
│   └── debateDB.ts           # SQLite WASM 래퍼 (IndexedDB 영속화)
├── stores/                   # Zustand 스토어
├── lib/                      # 유틸리티 (logger, fileHandling, debateExport 등)
└── types/                    # 공유 타입 정의
```

---

## 주의 사항

- API 키는 기기 로컬에만 저장되며 외부 서버로 전송되지 않습니다.
- AI API 호출은 앱에서 각 제공자 API로 직접 이루어집니다.
- Debug APK는 개발·테스트용입니다. 배포 시 서명된 Release APK를 사용하세요.

# Dashboard Frontend (MVP)

Smart Factory Stock Control 시스템의 관제 대시보드 프론트엔드입니다.
`docs/mvp 탭 구성` 설계 문서에 정의된 탭 구조(평면도 / 대시보드 / CCTV / 설정)와
5단계 재고 보충 프레임워크(감지 → 부족 인지 → 로봇 신호 → 운반 → 하역)를 구현합니다.

## 사용 언어 / 프레임워크

| 영역 | 선택 | 이유 |
|---|---|---|
| 언어 | TypeScript (strict, `noUncheckedIndexedAccess`) | 컴파일 타임에 타입 오류를 최대한 잡아 런타임 에러를 줄인다 |
| UI 프레임워크 | React 18 | 설계 문서가 명시한 "React 대시보드 웹앱"과 일치, 탭/패널 단위 컴포넌트화에 적합 |
| 빌드 도구 | Vite | 빠른 개발 서버, CSS Modules 기본 지원, 설정이 단순해 유지보수 부담이 적음 |
| 라우팅 | react-router-dom (HashRouter) | 탭을 URL로 표현(딥링크/새로고침 가능), 정적 호스팅 시 서버 리라이트 설정이 불필요한 HashRouter 채택 |
| 상태 관리 | zustand | Redux 대비 보일러플레이트가 적고, 스토어를 도메인별(factory/auth/ui)로 쪼개기 쉬워 실수 여지가 적다 |
| 런타임 검증 | zod | REST 응답과 WebSocket 메시지 등 "외부 경계"의 데이터를 파싱 시점에 검증해, 잘못된 데이터가 상태에 섞여 화면을 깨뜨리는 것을 원천 차단 |
| 테스트 | Vitest + Testing Library | Vite와 설정을 공유해 별도 트랜스파일 설정이 필요 없음 |

## 아키텍처 개요

```
src/
├─ shared/
│  ├─ domain/       # Line/RobotStatus/ShortageEvent 등 도메인 타입 + zod 스키마 (단일 소스)
│  ├─ api/          # REST 클라이언트 추상화 (ApiClient 인터페이스, httpApiClient 구현체)
│  ├─ realtime/     # WebSocket 클라이언트 추상화 (RealtimeClient 인터페이스, WebSocketRealtimeClient 구현체)
│  ├─ mocks/        # 백엔드 없이도 시연 가능한 브라우저 내 시뮬레이터 (mockApiClient/mockRealtimeClient)
│  └─ utils/        # Emitter 등 범용 유틸
├─ store/           # zustand 스토어 (factory 상태 / 인증 / UI 선택 상태) + 순수 함수 selector
├─ app/             # 라우터, 탭 레이아웃, 에러 바운더리, 실시간 연결 부트스트랩
├─ features/        # 탭별 화면 (splash, floorplan, dashboard, cctv, settings, shortage-approval)
└─ styles/          # 전역 디자인 토큰(CSS 변수) — 라이트/다크 모드 지원
```

### 왜 이렇게 나눴는가 (유지보수 / 에러 최소화 관점)

- **ApiClient / RealtimeClient 인터페이스로 분리**: 화면 코드는 실제 백엔드와 브라우저 내 mock 시뮬레이터의 차이를 전혀 모른다. `.env`의 `VITE_USE_MOCK` 하나로 전환되므로, 실제 FastAPI/MQTT 백엔드가 준비되면 `src/shared/mocks/` 폴더를 통째로 지우는 것만으로 전환이 끝난다.
- **모든 외부 데이터는 zod로 검증 후에만 상태에 반영**: WebSocket 메시지든 REST 응답이든, 형식이 어긋나면 콘솔 경고만 남기고 무시한다. 백엔드가 계약을 어겨도 화면이 하얗게 죽지 않는다.
- **탭마다 React ErrorBoundary로 감싸짐**: 한 탭의 렌더링 버그가 다른 탭이나 전체 앱을 무너뜨리지 않는다.
- **도메인 타입은 `shared/domain/types.ts` 한 곳에서만 정의**하고 zod 스키마(`schemas.ts`)가 이를 그대로 검증하므로, 타입과 검증 로직이 따로 놀 일이 없다.
- **`noUncheckedIndexedAccess`**: `Record<string, Line>` 같은 맵 조회 결과를 항상 `Line | undefined`로 취급하게 강제해, "존재하지 않는 라인 id" 같은 흔한 런타임 에러를 컴파일 타임에 잡는다.

## 실행 방법

이 저장소를 만든 환경에는 Node.js가 설치되어 있지 않아 `npm install` / 빌드 검증을 직접 수행하지 못했습니다.
Node.js 18+ 환경에서 아래 순서로 실행해주세요.

```bash
cd src/dashboard-frontend
npm install
cp .env.example .env   # 기본값(VITE_USE_MOCK=true)만으로 백엔드 없이 바로 데모 가능
npm run dev            # http://localhost:5173
```

- `npm run test` — Vitest로 도메인 스키마 검증 및 상태 selector 단위 테스트 실행
- `npm run lint` — ESLint
- `npm run build` — 타입체크(`tsc -b`) 후 프로덕션 빌드

## Mock 시뮬레이션 동작

`VITE_USE_MOCK=true`(기본값)일 때 `shared/mocks/mockFactoryBackend.ts`가 브라우저 메모리에서
4개 생산라인의 재고를 서서히 감소시키다가 임계치(20%) 이하가 되면 부족 이벤트를 발생시킵니다.
대시보드 상단의 승인 팝업에서 **보충 승인**을 누르면, 설계 문서의 5단계와 동일하게
보관소 OMX-F → Beagle 이동 → 라인 OMX-F 하역 순으로 로봇 상태/위치가 실시간으로 바뀌고,
평면도 탭에서 Beagle이 보관소에서 라인까지 이동하는 것을 확인할 수 있습니다.

실제 백엔드 연동 시 `.env`에서 `VITE_USE_MOCK=false`로 바꾸고
`VITE_API_BASE_URL`, `VITE_WS_URL`을 설정하면 됩니다. 백엔드가 지켜야 할 계약은
`src/shared/domain/schemas.ts`(REST 스냅샷 응답, WebSocket 메시지 봉투)와
`src/shared/api/ApiClient.ts`(엔드포인트 목록)에 그대로 정의되어 있습니다.

# 백엔드 연동 가이드

FastAPI 백엔드가 준비됐을 때 프론트엔드를 붙이는 절차입니다.
API 계약 자체는 [`API.md`](./API.md)를 보세요. 이 문서는 **어디를 고쳐야 하는지**만 다룹니다.

---

## 1. 요약: 고칠 파일은 3개뿐

| 순서 | 파일 | 할 일 |
|---|---|---|
| 1 | `.env` | `VITE_USE_MOCK=false`, 서버 주소 지정 |
| 2 | `src/shared/api/endpoints.ts` | 실제 라우터 경로와 맞추기 |
| 3 | `src/shared/domain/schemas.ts` | 응답 필드가 다르면 스키마 조정 |

화면 코드(`features/**`)는 **손대지 않습니다.** 컴포넌트는 경로도 fetch도 모르고,
`useLines()` 같은 훅만 호출합니다.

---

## 2. 계층 구조

```
features/**  (화면)
     │  useLines() / useCameras() / useApproveShortage() …
     ▼
shared/query/**            ← TanStack Query 훅. 캐시·로딩·에러·재시도
     │  factoryApi.fetchSnapshot()
     ▼
shared/api/FactoryApi.ts   ← 계약(interface). 여기가 유일한 경계
     ├── httpFactoryApi.ts  → 실제 FastAPI
     └── mockFactoryApi.ts  → 브라우저 내 시뮬레이터
              │  request()
              ▼
        httpClient.ts       ← fetch 래퍼: 타임아웃·에러 정규화·zod 검증
        endpoints.ts        ← 경로 문자열이 존재하는 유일한 파일
```

**핵심**: `FactoryApi` 인터페이스를 mock과 http가 똑같이 구현합니다.
그래서 백엔드가 없어도 화면 개발이 가능하고, 붙일 때 화면을 고칠 일이 없습니다.

---

## 3. 연동 절차

### 3-1. 환경 변수

```bash
# .env
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
```

`VITE_USE_MOCK`을 명시적으로 `false`로 두어야 실제 백엔드를 씁니다.
기본값이 mock인 이유는, 저장소를 처음 받은 사람이 `npm run dev`만으로 화면을 볼 수 있게 하기 위함입니다.

### 3-2. 엔드포인트가 하나씩 열릴 때

`endpoints.ts`에 아직 구현되지 않은 API 목록이 있습니다.

```ts
export const NOT_YET_IMPLEMENTED = ['cameras', 'permissions', 'inventoryHistory'];
```

백엔드에 `/cameras` 라우터가 생기면 이 배열에서 `'cameras'`만 지우면 됩니다.
그 전까지는 호출을 시도하지 않고 안전한 기본값을 돌려주므로, **일부만 완성된 백엔드에도 붙일 수 있습니다.**

### 3-3. 응답 형태가 계약과 다를 때

`httpClient`가 모든 응답을 zod로 검증합니다. 형태가 어긋나면 이런 오류가 납니다.

```
ApiError { kind: 'contract', message: '서버 응답 형식이 예상과 다릅니다' }
```

화면 깊은 곳에서 `undefined` 참조로 터지는 대신 요청 지점에서 잡히므로,
콘솔의 `detail`을 보고 `schemas.ts`를 고치거나 백엔드를 맞추면 됩니다.

> **필드 추가는 안전합니다.** zod는 모르는 필드를 무시합니다.
> **필드 누락·타입 변경·enum 값 추가는 즉시 장애**가 되니 프론트와 함께 수정해야 합니다.

---

## 4. ROS2 → WebSocket 주의사항

로봇 데이터가 ROS2 → FastAPI → WebSocket으로 흐릅니다. 프론트 쪽 전제는 다음과 같습니다.

| 항목 | 전제 | 이유 |
|---|---|---|
| 메시지 형식 | `{ "type": "...", "payload": {...} }` | 봉투 형태로 고정. `API.md` 3절 |
| Beagle 위치 갱신 | **1초 내외** | 더 촘촘하면 1초 transition 애니메이션이 끊겨 보임 |
| 좌표 | `x`, `y` 모두 **0~100 상대값** | 평면도 viewBox로 변환해 사용. 미터 단위로 보내면 안 됨 |
| 깨진 메시지 | 한 건만 무시하고 연결 유지 | 로봇 한 대의 이상이 전체 화면을 멈추지 않게 |
| 재연결 | 프론트가 지수 백오프(1s→15s)로 자동 | 백엔드는 재연결을 신경 쓰지 않아도 됨 |

### 스냅샷과 실시간의 역할 분담

- **REST `/snapshot`** — 부팅 시 1회. 전체 상태를 채웁니다.
- **WebSocket** — 이후 **변경분만**. 프론트는 폴링하지 않습니다.

WebSocket 메시지는 Query 캐시를 직접 갱신합니다(`useRealtimeSync`).
`invalidateQueries`로 스냅샷을 다시 받지 않는 이유는, 초당 여러 건 들어오는
로봇 위치마다 전체를 재조회하면 실시간성이 오히려 나빠지기 때문입니다.

> ⚠️ **`line.inventory`는 스냅샷에 이미 있는 라인만 갱신합니다.**
> 스냅샷에 없는 `lineId`가 오면 무시합니다. 부분 데이터로 캐시를 만들면
> `name`, `position` 같은 필수 필드가 빠진 라인이 생기기 때문입니다.
> **라인을 추가하면 `/snapshot`에도 반드시 포함**시켜 주세요.

---

## 5. 승인/반려 처리 시 지켜야 할 것

승인 API는 **응답 Body로도 돌려주고, WebSocket으로도 브로드캐스트**해야 합니다.

| 경로 | 목적 |
|---|---|
| HTTP 응답 | 요청한 관리자 화면이 즉시 반영 (왕복 대기 없음) |
| WS 브로드캐스트 | 다른 관리자 화면 동기화 |

프론트는 같은 `id`를 교체하므로 두 번 반영돼도 중복되지 않습니다.

승인/반려 mutation은 **자동 재시도하지 않습니다**(`queryClient.ts`).
로봇을 실제로 움직이는 부작용이 있어, 재시도가 중복 지시로 이어질 수 있기 때문입니다.
타임아웃이 나면 사용자가 직접 다시 누릅니다.

---

## 6. 오류 처리 규약

`httpClient`가 모든 실패를 `ApiError` 하나로 정규화합니다.

| kind | 언제 | 자동 재시도 | 화면 |
|---|---|---|---|
| `network` | 오프라인·DNS·CORS·타임아웃 | ✅ (최대 2회) | "서버에 연결할 수 없습니다" + 재시도 버튼 |
| `server` | 5xx | ✅ (최대 2회) | "서버에서 오류가 발생했습니다" + 재시도 버튼 |
| `client` | 4xx | ❌ | FastAPI의 `detail` 문구를 그대로 노출 |
| `contract` | 200인데 형태 불일치 | ❌ | "API 버전이 어긋났을 수 있습니다" |

FastAPI의 두 가지 detail 형태를 모두 파싱합니다.

```python
# 둘 다 화면에 그대로 노출됩니다
raise HTTPException(404, detail="부족 이벤트를 찾을 수 없습니다")
# 422 검증 오류의 [{loc, msg, type}] 배열도 msg만 모아 표시
```

> 사용자에게 보일 문구는 `detail`에 한국어로 넣어 주세요. 그대로 노출됩니다.

---

## 7. 엔드포인트를 쪼갤 경우

지금은 `/snapshot` 하나가 라인·로봇·부족 이벤트를 모두 담습니다.
`/lines`, `/robots`처럼 나누고 싶다면 `useFactoryData.ts`의 훅만 각자의
`useQuery`로 바꾸면 됩니다. **컴포넌트가 쓰는 시그니처는 그대로**라 화면은 손대지 않습니다.

```ts
// 지금: 스냅샷 하나에서 select로 잘라 씀
export function useLines() {
  const { data, ... } = useFactoryQuery({ select: selectLines });
  return { lines: data ?? EMPTY, ... };
}

// 나중: 전용 엔드포인트로 교체해도 반환 형태는 동일
export function useLines() {
  const { data, ... } = useQuery({
    queryKey: queryKeys.factory.lines(),
    queryFn: ({ signal }) => factoryApi.fetchLines(signal),
  });
  return { lines: data ?? EMPTY, ... };
}
```

---

## 8. 아직 계약이 없는 영역

| 영역 | 현재 상태 | 필요한 것 |
|---|---|---|
| 인증 | `useAuthStore`가 localStorage에만 저장. 검증 없음 | 로그인/세션 API. 도입 후 `approvedBy`는 **서버가 토큰에서 판정**해야 함(위조 방지) |
| 카메라 스트림 | 목록 API는 준비됨, 영상은 자리표시자 | `streamUrl` (RTSP/HLS/WebRTC) |

`Camera.streamUrl`은 스키마에 이미 선택 필드로 있습니다. 백엔드가 채워 보내면
`CameraFeed` 컴포넌트에서 실제 영상으로 교체하면 됩니다.

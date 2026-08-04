# API 명세

스마트 팩토리 재고 관제 대시보드가 백엔드에 요구하는 인터페이스 목록입니다.

이 문서는 프론트엔드 코드에서 직접 추출했으며, 아래 파일이 계약의 원본입니다.

| 계약 | 파일 |
|---|---|
| REST 인터페이스 | `src/dashboard-frontend/src/shared/api/ApiClient.ts` |
| REST 구현 (경로·메서드) | `src/dashboard-frontend/src/shared/api/httpApiClient.ts` |
| 실시간 인터페이스 | `src/dashboard-frontend/src/shared/realtime/RealtimeClient.ts` |
| 스키마 (검증 기준) | `src/dashboard-frontend/src/shared/domain/schemas.ts` |

---

## 1. 공통 규약

| 항목 | 값 | 비고 |
|---|---|---|
| REST Base URL | `VITE_API_BASE_URL` (기본 `/api`) | `.env`로 주입 |
| WebSocket URL | `VITE_WS_URL` (기본 `ws://localhost:8000/ws`) | `.env`로 주입 |
| 요청 Content-Type | `application/json` | |
| 시각 표기 | ISO 8601 문자열 (예: `2026-08-04T06:07:20.123Z`) | 모든 `*At` 필드 |
| 좌표계 | `x`, `y` 모두 `0~100` 상대값 | 평면도 viewBox로 변환해 사용 |
| 응답 검증 | 모든 응답을 zod 스키마로 검증 | 형식 불일치 시 요청 실패 처리 |

> **중요**: 응답이 스키마와 다르면 프론트는 데이터를 버리고 에러를 냅니다.
> 필드 추가는 안전하지만, **필드 누락·타입 변경·enum 값 추가는 즉시 장애**가 됩니다.

---

## 2. REST API — 현재 프론트가 호출 중

`httpApiClient.ts`에 이미 구현되어 있어, 백엔드가 아래 3개만 제공하면 `VITE_USE_MOCK=false`로 바로 연동됩니다.

| # | 기능 | Method | Path | 요청 Body | 응답 | 호출 시점 |
|---|---|---|---|---|---|---|
| 1 | 초기 스냅샷 조회 | `GET` | `/snapshot` | — | [`Snapshot`](#41-snapshot) | 앱 부팅 시 1회 |
| 2 | 보충 승인 | `POST` | `/shortage-events/{id}/approve` | `{ "approvedBy": string }` | [`ShortageEvent`](#43-shortageevent) | 승인 팝업 · 보충 승인 |
| 3 | 보충 반려 | `POST` | `/shortage-events/{id}/reject` | — | [`ShortageEvent`](#43-shortageevent) | 승인 팝업 · 반려 |

### 동작 요구사항

| API | 백엔드가 해야 할 일 |
|---|---|
| `GET /snapshot` | 현재 전체 라인·로봇·부족 이벤트를 한 번에 반환. 화면 첫 진입 시 이 응답만으로 전 탭이 채워져야 함 |
| `POST .../approve` | 상태를 `dispatched`로 전이, `approvedBy`/`approvedAt` 기록, 보관소 OMX-F에 보충 지시 발행 |
| `POST .../reject` | 상태를 `rejected`로 전이. 재감지 쿨다운을 두어 즉시 재알람이 뜨지 않게 할 것 |

> 승인/반려 결과는 **응답 Body로도 돌려주고, WebSocket `line.shortage`로도 브로드캐스트**해야 합니다.
> 응답은 요청한 관리자 화면용, 브로드캐스트는 다른 관리자 화면 동기화용입니다.

---

## 3. WebSocket — 실시간 채널

단일 엔드포인트(`VITE_WS_URL`)로 접속하며, 서버는 아래 3종 메시지를 push합니다.
프론트는 **송신하지 않습니다**(수신 전용). 연결이 끊기면 지수 백오프(1s→15s)로 자동 재연결합니다.

### 메시지 봉투

```json
{ "type": "<타입>", "payload": { ... } }
```

| # | `type` | payload | 발생 시점 | 대응 MQTT 토픽(설계 문서) |
|---|---|---|---|---|
| 1 | `line.inventory` | [`LineUpdate`](#42-lineupdate) | 라인 재고 면적이 변할 때마다 | `line/{id}/inventory` |
| 2 | `line.shortage` | [`ShortageEvent`](#43-shortageevent) | 부족 감지 시 + 이후 모든 상태 전이 시 | `line/{id}/shortage` |
| 3 | `robot.status` | [`RobotStatus`](#44-robotstatus) | 로봇 상태·위치가 변할 때마다 | `robot/{id}/status` |

### 화면별 사용처

| 메시지 | 사용 화면 |
|---|---|
| `line.inventory` | 대시보드 부품 현황 카드, 요약 타일, 평면도 구역 색, 재고 추이 그래프 |
| `line.shortage` | 승인 팝업(모든 뷰 위), 알림 섹션, 액션 로그, 평면도 부족 LED, CCTV 카메라 강조 |
| `robot.status` | 로봇 동작 현황, 평면도 로봇 위치(Beagle 실시간 이동) |

> `robot.status`의 `position`이 바뀌면 평면도에서 1초 transition으로 부드럽게 이동합니다.
> Beagle GPS 갱신 주기는 **1초 내외**를 권장합니다. 더 촘촘하면 애니메이션이 끊겨 보입니다.

---

## 4. 데이터 모델

### 4.1 Snapshot

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `lines` | `Line[]` | ✅ | 전체 생산라인 |
| `robots` | `RobotStatus[]` | ✅ | 전체 로봇 |
| `shortageEvents` | `ShortageEvent[]` | ✅ | 부족 이벤트 (완료·반려 이력 포함) |

### 4.2 Line / LineUpdate

`Line`은 스냅샷용 전체 정보, `LineUpdate`는 실시간 변경분입니다.

| 필드 | 타입 | 필수 | `Line` | `LineUpdate` | 설명 |
|---|---|---|:---:|:---:|---|
| `id` / `lineId` | `string` | ✅ | `id` | `lineId` | 라인 식별자 (예: `line-a`) |
| `name` | `string` | ✅ | ✅ | — | 표시 이름 (예: `A라인`) |
| `threshold` | `number` | ✅ | ✅ | — | 부족 판정 임계치 (%) |
| `currentQty` | `number` | ✅ | ✅ | ✅ | 현재 부품 적재 면적 비율 (0~100) |
| `status` | `LineStatus` | ✅ | ✅ | ✅ | `normal` \| `restocking` |
| `updatedAt` | `string` | ✅ | ✅ | ✅ | ISO 8601 |
| `position` | `{ x, y }` | ✅ | ✅ | — | 평면도 좌표 (0~100) |

> `currentQty`는 **개수가 아니라 면적 비율**입니다. 천장 카메라가 빈/트레이 전체 면적 대비
> 부품이 차지한 면적을 계산한 값이며, `threshold`(기본 20%) 이하에서 부족으로 판정합니다.

### 4.3 ShortageEvent

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `id` | `string` | ✅ | 이벤트 식별자 |
| `lineId` | `string` | ✅ | 발생 라인 |
| `detectedAt` | `string` | ✅ | 감지 시각 (ISO 8601) |
| `status` | `ShortageEventStatus` | ✅ | 아래 enum 참조 |
| `partName` | `string` | ✅ | 부족 부품명 (예: `M6 볼트 세트`) |
| `requiredQty` | `number` | ✅ | 가져올 개수 |
| `approvedBy` | `string` | ⬜ | 승인한 관리자 표시명 |
| `approvedAt` | `string` | ⬜ | 승인 시각 (ISO 8601) |

### 4.4 RobotStatus

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `robotId` | `string` | ✅ | 로봇 식별자 (예: `beagle-1`, `omxf-line-a`) |
| `type` | `RobotType` | ✅ | 아래 enum 참조 |
| `state` | `RobotState` | ✅ | 아래 enum 참조 |
| `currentTaskId` | `string` | ⬜ | 수행 중인 작업 id |
| `position` | `{ x, y }` | ✅ | 평면도 좌표 (0~100) |
| `updatedAt` | `string` | ✅ | ISO 8601 |

---

## 5. 열거형

값을 **추가하면 프론트 검증이 실패**합니다. 변경 시 `schemas.ts`를 함께 수정해야 합니다.

| 열거형 | 값 | 프론트 표시 |
|---|---|---|
| `LineStatus` | `normal` | 정상 운영 |
| | `restocking` | 보충 중 (파란색) |
| `ShortageEventStatus` | `pending_approval` | 승인 대기 (빨강 · 팝업 표시) |
| | `dispatched` | 보충 지시됨 (주황) |
| | `in_transit` | 운반 중 (파랑) |
| | `completed` | 완료 (초록) |
| | `rejected` | 반려됨 (회색) |
| `RobotType` | `beagle` | Beagle — 평면도에서 LED로 실시간 이동 표시 |
| | `omxf_storage` | OMX-F 보관소 |
| | `omxf_line` | OMX-F 라인 |
| `RobotState` | `idle` | 대기 (회색) |
| | `moving` | 이동 중 (파랑 · 점멸) |
| | `working` | 작업 중 (파랑 · 점멸) |
| | `error` | 오류 (빨강) |
| | `offline` | 오프라인 (회색) |

---

## 6. 상태 전이

부족 발생부터 보충 완료까지의 흐름입니다. 각 단계에서 `line.shortage`를 브로드캐스트해야 합니다.

| 순서 | 상태 | 트리거 | 로봇 동작 |
|---|---|---|---|
| 1 | `pending_approval` | 카메라가 임계치 이하 감지 | — (승인 팝업 표시) |
| 2 | `dispatched` | `POST .../approve` | 보관소 OMX-F가 Beagle에 적재 |
| 3 | `in_transit` | 적재 완료 | Beagle이 해당 라인으로 이동 |
| 4 | `completed` | 라인 OMX-F 하역 완료 | 라인 `status`를 `normal`로 복귀 |
| — | `rejected` | `POST .../reject` | 없음 (쿨다운 후 재감지) |

> **자동 동작 모드**: 설정에서 "관리자 승인 필수"를 끄면 프론트가 `pending_approval` 건을
> 즉시 `approve`로 호출합니다(`useAutoApproval`). 백엔드는 별도 분기가 필요 없습니다.

---

## 7. 추가로 필요한 API — 계약 미정

화면 기능은 이미 있으나 현재 **브라우저 로컬(localStorage) 또는 자리표시자**로 동작 중인 영역입니다.
실서비스 전환 시 아래가 필요하며, 경로·형태는 제안값입니다.

### 7.1 관리자 인증 (설정 탭)

현재: `useAuthStore`가 localStorage에만 저장. 검증 없음.

| 기능 | Method | Path (제안) | 요청 | 응답 |
|---|---|---|---|---|
| 회원가입 | `POST` | `/auth/signup` | `{ username, password, displayName }` | `{ user }` |
| 로그인 | `POST` | `/auth/login` | `{ username, password }` | `{ user, token }` |
| 로그아웃 | `POST` | `/auth/logout` | — | `204` |
| 세션 조회 | `GET` | `/auth/me` | — | `{ user }` |

> 승인 API의 `approvedBy`는 현재 클라이언트가 보냅니다. 인증 도입 후에는
> **서버가 토큰에서 판정**해야 합니다(위조 방지). 그때 요청 Body에서 `approvedBy` 제거.

### 7.2 승인 권한 설정 (설정 탭)

현재: `useUiStore`가 localStorage에만 저장 → 브라우저마다 설정이 달라짐.

| 기능 | Method | Path (제안) | 요청 / 응답 |
|---|---|---|---|
| 권한 설정 조회 | `GET` | `/settings/permissions` | `{ approvalRequired: boolean, authorizedApprovers: string[] }` |
| 권한 설정 저장 | `PUT` | `/settings/permissions` | 동일 |

> 로봇 자동 동작 여부를 결정하는 값이므로 **서버 보관이 맞습니다.**
> 현재 구조로는 관리자 A가 자동 모드를 켜도 관리자 B 화면에는 반영되지 않습니다.

### 7.3 카메라 (CCTV 탭 · 평면도 사이드 패널)

현재: 라인 목록에서 `cam-{lineId}`를 파생 생성, 화면은 자리표시자.

| 기능 | Method | Path (제안) | 응답 |
|---|---|---|---|
| 카메라 목록 | `GET` | `/cameras` | `[{ id, lineId, label, streamUrl, online }]` |
| 스트림 | — | RTSP / WebRTC / HLS | 실시간 영상 |

> 카메라와 라인은 실제로 1:1이 아닐 수 있습니다(라인당 여러 대). 목록 API가 생기면
> `lineId` 기준으로 묶어 부족 라인 카메라를 강조하는 현재 로직을 그대로 쓸 수 있습니다.

### 7.4 재고 추이 이력

현재: WebSocket 수신값을 브라우저 메모리에 최대 30포인트 누적 → **새로고침 시 소실**.

| 기능 | Method | Path (제안) | 요청 | 응답 |
|---|---|---|---|---|
| 라인 재고 이력 | `GET` | `/lines/{id}/inventory-history` | `?from=&to=` | `[{ qty, at }]` |

### 7.5 액션 로그 조회

현재: `shortageEvents` 스냅샷에서 파생. 오래된 이력은 조회 불가.

| 기능 | Method | Path (제안) | 요청 | 응답 |
|---|---|---|---|---|
| 액션 로그 | `GET` | `/action-logs` | `?from=&to=&lineId=&limit=` | `ShortageEvent[]` |

---

## 8. 에러 규약

| 상황 | 프론트 동작 |
|---|---|
| HTTP 4xx / 5xx | `API 요청 실패: {path} (HTTP {status})` 예외. 승인 팝업은 닫히지 않고 재시도 가능 |
| 응답 스키마 불일치 | `API 응답 형식 오류: {path}` 예외. 데이터 미반영 |
| WS 메시지 JSON 파싱 실패 | 해당 메시지만 무시 + `console.warn`. 연결 유지 |
| WS 메시지 스키마 불일치 | 해당 메시지만 무시 + `console.warn`. 연결 유지 |
| WS 연결 끊김 | 지수 백오프(1s→15s) 자동 재연결. 좌측 네비에 "연결 끊김" 표시 |

> 실시간 메시지는 **한 건이 깨져도 전체가 멈추지 않도록** 설계되어 있습니다.
> 반면 REST는 실패를 삼키지 않고 예외로 올립니다.

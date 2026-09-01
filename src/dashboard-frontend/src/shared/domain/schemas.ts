import { z } from 'zod';

/**
 * 외부 경계(REST 응답, WebSocket 메시지)에서 들어오는 모든 데이터는
 * 이 파일의 스키마로 검증한 뒤에만 앱 상태로 편입한다.
 * 형식이 어긋난 데이터는 화면을 깨뜨리지 않고 무시/로깅한다.
 */

/**
 * 백엔드(FastAPI/Pydantic)는 값이 없는 optional 문자열 필드를 생략하지 않고
 * 명시적으로 `null`을 내려준다(예: 대기 중인 로봇의 `currentTaskId: null`). 그래서 이
 * 필드는 와이어 상에서는 "생략 가능"이 아니라 "항상 있지만 null일 수 있음"이다 —
 * `.optional()`이 아니라 `.nullable()`이 실제 계약과 맞는다.
 * `.nullable()`만 쓰면 출력 타입이 `string | null`이 되므로, 도메인 타입(`?: string`)에
 * 맞추기 위해 `null`을 `undefined`로 바꾸는 transform을 하나 더 얹는다.
 *
 * 지금 쓰이는 대상이 전부 문자열이라 이 하나로 통일해 쓴다.
 */
const optionalString = z.string().nullable().transform((value) => value ?? undefined);

/**
 * optionalString의 관대한 판 — 필드 자체가 아직 응답에 없을 수도 있을 때 쓴다.
 *
 * 백엔드와 프론트가 따로 배포되는 동안에는 "새로 약속한 필드가 아직 안 온다"가
 * 정상 상태다. 그런 필드까지 `.nullable()`로 잡으면 구버전 백엔드에 붙는 순간
 * 스냅샷 전체가 계약 위반으로 떨어져 화면이 비어 버린다 — 값 하나 없다고
 * 대시보드를 통째로 잃는 쪽이 훨씬 나쁘다.
 */
const nullishString = z.string().nullish().transform((value) => value ?? undefined);

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const LineStatusSchema = z.enum(['normal', 'restocking']);

export const BinSchema = z.object({
  id: z.string(),
  lineId: z.string(),
  label: z.string(),
  partId: z.string(),
  partName: z.string(),
  capacity: z.number(),
  threshold: z.number(),
  currentQty: z.number(),
  status: LineStatusSchema,
  updatedAt: z.string(),
});

export const LineSchema = z.object({
  id: z.string(),
  name: z.string(),
  threshold: z.number(),
  currentQty: z.number(),
  status: LineStatusSchema,
  updatedAt: z.string(),
  position: PositionSchema,
  bins: z.array(BinSchema).default([]),
});

export const InventoryEventSchema = z.object({
  id: z.string(),
  lineId: z.string(),
  qty: z.number(),
  detectedAt: z.string(),
});

export const ShortageEventStatusSchema = z.enum([
  'pending_approval',
  'dispatched',
  'in_transit',
  'completed',
  'rejected',
]);

export const ShortageEventSchema = z.object({
  id: z.string(),
  lineId: z.string(),
  binId: optionalString,
  detectedAt: z.string(),
  status: ShortageEventStatusSchema,
  partName: z.string(),
  requiredQty: z.number(),
  approvedBy: optionalString,
  approvedAt: optionalString,
});

export const StockVerdictSchema = z.enum(['shortage', 'sufficient']);
export const FeedbackSourceSchema = z.enum(['approve', 'reject', 'manual_toggle']);

export const DetectionFeedbackSchema = z.object({
  id: z.string(),
  lineId: z.string(),
  detected: StockVerdictSchema,
  corrected: StockVerdictSchema,
  source: FeedbackSourceSchema,
  by: z.string(),
  at: z.string(),
  shortageEventId: optionalString,
});

export const RobotTypeSchema = z.enum(['beagle', 'omxf_storage', 'omxf_line']);
export const RobotStateSchema = z.enum([
  'idle',
  'moving',
  'working',
  'error',
  'offline',
  // 작업에 실패한 팔이 스스로 대기 자세로 물러나 더 이상 지시를 받지 않는 상태.
  // error와 달리 로봇은 살아 있고, 사람이 복구를 눌러야만 다시 일을 받는다.
  'blocked',
]);

export const RobotStatusSchema = z.object({
  robotId: z.string(),
  type: RobotTypeSchema,
  state: RobotStateSchema,
  currentTaskId: optionalString,
  position: PositionSchema,
  updatedAt: z.string(),
  /**
   * 팔이 남긴 실패 사유 원문. 사람에게 그대로 보여줄 유일한 단서라 버리지 않는다.
   * 백엔드가 이 필드를 아직 안 내려도 파싱이 깨지면 안 되므로 nullish로 받는다.
   */
  blockedReason: nullishString,
});

/**
 * 백엔드 설계 문서의 5단계 프레임워크 → MQTT 토픽 매핑을
 * WebSocket 메시지 봉투(envelope) 타입으로 그대로 옮긴 것.
 *   line/{id}/inventory → 'line.inventory'
 *   line/{id}/shortage  → 'line.shortage'
 *   robot/*\/status      → 'robot.status'
 */
export const LineUpdateSchema = z.object({
  lineId: z.string(),
  currentQty: z.number(),
  status: LineStatusSchema,
  updatedAt: z.string(),
});
export type LineUpdate = z.infer<typeof LineUpdateSchema>;

/**
 * 칸(bin) 하나의 재고 갱신. line-a처럼 칸마다 다른 부품을 쌓는 라인에서는
 * 재고가 라인이 아니라 칸 단위로 바뀐다 — line.inventory에는 binId가 없어서
 * 이 이벤트가 없으면 칸의 재고율은 페이지를 새로 열기 전까지 그대로 멈춘다
 * (스냅샷은 한 번만 받고 폴링을 하지 않는다).
 */
export const BinUpdateSchema = z.object({
  lineId: z.string(),
  binId: z.string(),
  currentQty: z.number(),
  status: LineStatusSchema,
  updatedAt: z.string(),
});
export type BinUpdate = z.infer<typeof BinUpdateSchema>;

export const RealtimeMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('line.inventory'), payload: LineUpdateSchema }),
  z.object({ type: z.literal('line.bin.inventory'), payload: BinUpdateSchema }),
  z.object({ type: z.literal('line.shortage'), payload: ShortageEventSchema }),
  // 반려 건이 알림란에서 '삭제'되면 스냅샷을 다시 받지 않는 다른 화면의
  // 캐시에서도 빠져야 한다 (이슈 #46). id만 오는 유일한 제거형 메시지.
  z.object({ type: z.literal('line.shortage.removed'), payload: z.object({ id: z.string() }) }),
  z.object({ type: z.literal('robot.status'), payload: RobotStatusSchema }),
]);
export type RealtimeMessage = z.infer<typeof RealtimeMessageSchema>;

export const SnapshotSchema = z.object({
  lines: z.array(LineSchema),
  robots: z.array(RobotStatusSchema),
  shortageEvents: z.array(ShortageEventSchema),
});
export type Snapshot = z.infer<typeof SnapshotSchema>;

export const CameraScopeSchema = z.enum(['overview', 'line']);

export const CameraSchema = z.object({
  id: z.string(),
  scope: CameraScopeSchema,
  lineId: optionalString,
  label: z.string(),
  streamUrl: optionalString,
  online: z.boolean(),
});
export const CameraListSchema = z.array(CameraSchema);

export const PermissionsSchema = z.object({
  approvalRequired: z.boolean(),
  authorizedApprovers: z.array(z.string()),
});

export const InventoryPointSchema = z.object({
  qty: z.number(),
  at: z.string(),
});
export const InventoryHistorySchema = z.array(InventoryPointSchema);

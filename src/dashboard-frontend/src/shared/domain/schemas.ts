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

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const LineStatusSchema = z.enum(['normal', 'restocking']);

export const LineSchema = z.object({
  id: z.string(),
  name: z.string(),
  threshold: z.number(),
  currentQty: z.number(),
  status: LineStatusSchema,
  updatedAt: z.string(),
  position: PositionSchema,
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
export const RobotStateSchema = z.enum(['idle', 'moving', 'working', 'error', 'offline']);

export const RobotStatusSchema = z.object({
  robotId: z.string(),
  type: RobotTypeSchema,
  state: RobotStateSchema,
  currentTaskId: optionalString,
  position: PositionSchema,
  updatedAt: z.string(),
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

export const RealtimeMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('line.inventory'), payload: LineUpdateSchema }),
  z.object({ type: z.literal('line.shortage'), payload: ShortageEventSchema }),
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

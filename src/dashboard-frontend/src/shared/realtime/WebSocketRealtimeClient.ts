import { RealtimeMessageSchema } from '../domain/schemas';
import type { RealtimeMessage } from '../domain/schemas';
import { Emitter } from '../utils/emitter';
import type { ConnectionStatus, RealtimeClient } from './RealtimeClient';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000/ws';
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 15000;

/**
 * 백엔드 설계 문서의 "WebSocket Hub" 소비자.
 * 들어오는 모든 메시지는 RealtimeMessageSchema로 검증하며,
 * 형식이 어긋나면 화면을 깨뜨리지 않고 무시 + 콘솔 경고만 남긴다.
 * 연결이 끊기면 지수 백오프로 자동 재연결한다.
 */
export class WebSocketRealtimeClient implements RealtimeClient {
  private socket: WebSocket | null = null;
  private messageEmitter = new Emitter<RealtimeMessage>();
  private statusEmitter = new Emitter<ConnectionStatus>();
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyClosed = false;

  connect(): void {
    this.manuallyClosed = false;
    this.open();
  }

  disconnect(): void {
    this.manuallyClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.socket?.close();
    this.socket = null;
  }

  onMessage(handler: (message: RealtimeMessage) => void): () => void {
    return this.messageEmitter.on(handler);
  }

  onStatusChange(handler: (status: ConnectionStatus) => void): () => void {
    return this.statusEmitter.on(handler);
  }

  private open(): void {
    this.statusEmitter.emit('connecting');
    const socket = new WebSocket(WS_URL);
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempt = 0;
      this.statusEmitter.emit('open');
    };

    socket.onmessage = (event) => {
      this.handleRawMessage(event.data);
    };

    socket.onerror = () => {
      this.statusEmitter.emit('error');
    };

    socket.onclose = () => {
      this.statusEmitter.emit('closed');
      if (!this.manuallyClosed) this.scheduleReconnect();
    };
  }

  private handleRawMessage(raw: unknown): void {
    if (typeof raw !== 'string') return;

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      console.warn('[realtime] JSON 파싱 실패, 메시지를 무시합니다:', raw);
      return;
    }

    const result = RealtimeMessageSchema.safeParse(parsedJson);
    if (!result.success) {
      console.warn('[realtime] 알 수 없는 메시지 형식, 무시합니다:', result.error.flatten());
      return;
    }

    this.messageEmitter.emit(result.data);
  }

  private scheduleReconnect(): void {
    const delay = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** this.reconnectAttempt);
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => this.open(), delay);
  }
}

export const webSocketRealtimeClient = new WebSocketRealtimeClient();

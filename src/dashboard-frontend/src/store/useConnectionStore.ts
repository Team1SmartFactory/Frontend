import { create } from 'zustand';
import type { ConnectionStatus } from '../shared/realtime/RealtimeClient';

interface ConnectionState {
  status: ConnectionStatus;
  setStatus: (status: ConnectionStatus) => void;
}

/**
 * WebSocket 연결 상태.
 *
 * 서버에서 받아온 데이터가 아니라 "클라이언트가 지금 서버와 이어져 있는가"이므로
 * Query 캐시가 아니라 클라이언트 스토어에 둔다.
 * (서버 상태는 Query, 클라이언트 상태는 Zustand로 역할을 갈랐다)
 */
export const useConnectionStore = create<ConnectionState>((set) => ({
  status: 'connecting',
  setStatus: (status) => set({ status }),
}));

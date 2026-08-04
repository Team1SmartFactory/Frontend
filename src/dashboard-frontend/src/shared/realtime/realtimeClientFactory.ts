import type { RealtimeClient } from './RealtimeClient';
import { webSocketRealtimeClient } from './WebSocketRealtimeClient';
import { mockRealtimeClient } from '../mocks/mockRealtimeClient';

const useMock = import.meta.env.VITE_USE_MOCK !== 'false';

export const realtimeClient: RealtimeClient = useMock ? mockRealtimeClient : webSocketRealtimeClient;

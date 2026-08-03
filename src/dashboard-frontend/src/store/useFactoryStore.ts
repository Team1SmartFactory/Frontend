import { create } from 'zustand';
import type { Line, RobotStatus, ShortageEvent } from '../shared/domain/types';
import type { RealtimeMessage, Snapshot } from '../shared/domain/schemas';
import type { ConnectionStatus } from '../shared/realtime/RealtimeClient';

export interface InventoryPoint {
  qty: number;
  at: string;
}

const MAX_HISTORY_POINTS = 30;

interface FactoryState {
  connectionStatus: ConnectionStatus;
  lines: Record<string, Line>;
  robots: Record<string, RobotStatus>;
  shortageEvents: Record<string, ShortageEvent>;
  inventoryHistory: Record<string, InventoryPoint[]>;

  setConnectionStatus: (status: ConnectionStatus) => void;
  hydrate: (snapshot: Snapshot) => void;
  applyRealtimeMessage: (message: RealtimeMessage) => void;
  upsertShortageEvent: (event: ShortageEvent) => void;
}

export const useFactoryStore = create<FactoryState>((set) => ({
  connectionStatus: 'connecting',
  lines: {},
  robots: {},
  shortageEvents: {},
  inventoryHistory: {},

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  hydrate: (snapshot) =>
    set(() => ({
      lines: Object.fromEntries(snapshot.lines.map((line) => [line.id, line])),
      robots: Object.fromEntries(snapshot.robots.map((robot) => [robot.robotId, robot])),
      shortageEvents: Object.fromEntries(snapshot.shortageEvents.map((event) => [event.id, event])),
    })),

  applyRealtimeMessage: (message) =>
    set((state) => {
      switch (message.type) {
        case 'line.inventory': {
          const { lineId, currentQty, status, updatedAt } = message.payload;
          const existing = state.lines[lineId];
          if (!existing) return state;

          const history = state.inventoryHistory[lineId] ?? [];
          const nextHistory = [...history, { qty: currentQty, at: updatedAt }].slice(-MAX_HISTORY_POINTS);

          return {
            lines: { ...state.lines, [lineId]: { ...existing, currentQty, status, updatedAt } },
            inventoryHistory: { ...state.inventoryHistory, [lineId]: nextHistory },
          };
        }
        case 'line.shortage': {
          const event = message.payload;
          return { shortageEvents: { ...state.shortageEvents, [event.id]: event } };
        }
        case 'robot.status': {
          const robot = message.payload;
          return { robots: { ...state.robots, [robot.robotId]: robot } };
        }
        default:
          return state;
      }
    }),

  upsertShortageEvent: (event) =>
    set((state) => ({ shortageEvents: { ...state.shortageEvents, [event.id]: event } })),
}));

import type { RealtimeMessage } from '../domain/schemas';
import { Emitter } from '../utils/emitter';
import type { ConnectionStatus, RealtimeClient } from '../realtime/RealtimeClient';
import { mockFactoryBackend } from './mockFactoryBackend';

const HANDSHAKE_DELAY_MS = 300;

export class MockRealtimeClient implements RealtimeClient {
  private statusEmitter = new Emitter<ConnectionStatus>();

  connect(): void {
    this.statusEmitter.emit('connecting');
    setTimeout(() => this.statusEmitter.emit('open'), HANDSHAKE_DELAY_MS);
  }

  disconnect(): void {
    this.statusEmitter.emit('closed');
  }

  onMessage(handler: (message: RealtimeMessage) => void): () => void {
    return mockFactoryBackend.subscribe(handler);
  }

  onStatusChange(handler: (status: ConnectionStatus) => void): () => void {
    return this.statusEmitter.on(handler);
  }
}

export const mockRealtimeClient = new MockRealtimeClient();

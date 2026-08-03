type Listener<T> = (payload: T) => void;

/** 최소 기능의 타입 안전 pub/sub. 브라우저에는 Node의 EventEmitter가 없어 직접 둔다. */
export class Emitter<T> {
  private listeners = new Set<Listener<T>>();

  on(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(payload: T): void {
    this.listeners.forEach((listener) => listener(payload));
  }
}

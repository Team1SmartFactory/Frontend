import type { FactoryApi } from './FactoryApi';
import { httpFactoryApi } from './httpFactoryApi';
import { mockFactoryApi } from '../mocks/mockFactoryApi';

/**
 * mock ↔ 실제 백엔드 전환 지점.
 *
 * VITE_USE_MOCK을 명시적으로 'false'로 둔 경우에만 실제 백엔드를 쓴다.
 * 기본값을 mock으로 둔 것은, 백엔드가 없는 상태에서 처음 받은 사람이
 * npm run dev만으로 화면을 볼 수 있게 하기 위함이다.
 */
const useMock = import.meta.env.VITE_USE_MOCK !== 'false';

export const factoryApi: FactoryApi = useMock ? mockFactoryApi : httpFactoryApi;

export { ApiError } from './ApiError';
export type { FactoryApi } from './FactoryApi';

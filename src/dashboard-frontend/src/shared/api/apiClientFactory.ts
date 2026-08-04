import type { ApiClient } from './ApiClient';
import { httpApiClient } from './httpApiClient';
import { mockApiClient } from '../mocks/mockApiClient';

/** VITE_USE_MOCK을 명시적으로 'false'로 설정한 경우에만 실제 백엔드를 사용한다. */
const useMock = import.meta.env.VITE_USE_MOCK !== 'false';

export const apiClient: ApiClient = useMock ? mockApiClient : httpApiClient;

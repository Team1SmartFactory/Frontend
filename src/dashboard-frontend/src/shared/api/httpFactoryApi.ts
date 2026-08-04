import {
  CameraListSchema,
  InventoryHistorySchema,
  PermissionsSchema,
  ShortageEventSchema,
  SnapshotSchema,
} from '../domain/schemas';
import type { FactoryApi } from './FactoryApi';
import { ENDPOINTS, isImplemented } from './endpoints';
import { request } from './httpClient';

/**
 * 실제 FastAPI 백엔드 구현.
 *
 * 아직 라우터가 없는 엔드포인트(endpoints.ts의 NOT_YET_IMPLEMENTED)는
 * 호출을 시도하지 않고 안전한 기본값을 돌려준다. 백엔드가 순차적으로
 * 열릴 때 프론트를 고치지 않고 배열에서 이름만 빼면 실제 호출로 바뀐다.
 */
export const httpFactoryApi: FactoryApi = {
  fetchSnapshot: (signal) => request(ENDPOINTS.snapshot(), SnapshotSchema, { signal }),

  approveShortage: ({ id, approvedBy }) =>
    request(ENDPOINTS.approveShortage(id), ShortageEventSchema, {
      method: 'POST',
      // 인증이 붙으면 서버가 토큰에서 승인자를 판정해야 한다.
      // 그때 이 필드는 제거한다. (docs/API.md 7.1 참고)
      body: { approvedBy },
    }),

  rejectShortage: ({ id }) =>
    request(ENDPOINTS.rejectShortage(id), ShortageEventSchema, { method: 'POST' }),

  fetchCameras: (signal) => {
    if (!isImplemented('cameras')) return Promise.resolve([]);
    return request(ENDPOINTS.cameras(), CameraListSchema, { signal });
  },

  fetchPermissions: (signal) => {
    if (!isImplemented('permissions')) {
      return Promise.resolve({ approvalRequired: true, authorizedApprovers: ['admin'] });
    }
    return request(ENDPOINTS.permissions(), PermissionsSchema, { signal });
  },

  updatePermissions: (input) => {
    if (!isImplemented('permissions')) return Promise.resolve(input);
    return request(ENDPOINTS.permissions(), PermissionsSchema, { method: 'PUT', body: input });
  },

  fetchInventoryHistory: ({ lineId }, signal) => {
    if (!isImplemented('inventoryHistory')) return Promise.resolve([]);
    return request(ENDPOINTS.inventoryHistory(lineId), InventoryHistorySchema, { signal });
  },
};

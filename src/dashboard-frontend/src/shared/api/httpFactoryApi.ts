import { z } from 'zod';
import {
  BinSchema,
  CameraListSchema,
  InventoryHistorySchema,
  LineSchema,
  PermissionsSchema,
  ShortageEventSchema,
  SnapshotSchema,
} from '../domain/schemas';
import { DEFAULT_PERMISSIONS } from '../domain/types';
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

  overrideLineStock: ({ lineId, verdict, by }) =>
    request(ENDPOINTS.lineStock(lineId), LineSchema, {
      method: 'PUT',
      body: { verdict, by },
    }),

  overrideBinStock: ({ lineId, binId, verdict, by }) =>
    request(ENDPOINTS.binStock(lineId, binId), BinSchema, {
      method: 'PUT',
      body: { verdict, by },
    }),

  submitDetectionFeedback: async (input) => {
    // 라벨은 모으지 못해도 현장 동작은 계속되어야 하므로, 라우터가 열리기 전에는
    // 경고만 남기고 넘어간다. 조용히 버리면 "학습이 되고 있다"는 착각을 준다.
    if (!isImplemented('detectionFeedback')) {
      console.warn('[detection-feedback] 백엔드 라우터가 아직 없어 라벨을 보내지 못했습니다:', input);
      return;
    }
    await request(ENDPOINTS.detectionFeedback(), z.unknown(), { method: 'POST', body: input });
  },

  fetchCameras: (signal) => {
    if (!isImplemented('cameras')) return Promise.resolve([]);
    return request(ENDPOINTS.cameras(), CameraListSchema, { signal });
  },

  fetchPermissions: (signal) => {
    if (!isImplemented('permissions')) {
      return Promise.resolve(DEFAULT_PERMISSIONS);
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

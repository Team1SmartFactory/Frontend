import type { FactoryApi } from '../api/FactoryApi';
import { mockFactoryBackend } from './mockFactoryBackend';

mockFactoryBackend.start();

/** 서버 왕복을 흉내낸다. 로딩 상태가 한 프레임도 보이지 않으면 검증할 수 없다. */
const LATENCY_MS = 120;

function delayed<T>(produce: () => T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(produce()), LATENCY_MS);
  });
}

/**
 * 브라우저 안에서 도는 가짜 백엔드 어댑터.
 * httpFactoryApi와 동일한 FactoryApi 계약을 구현하므로,
 * 화면 코드는 둘 중 무엇이 붙었는지 알 수 없다.
 */
export const mockFactoryApi: FactoryApi = {
  fetchSnapshot: () => delayed(() => mockFactoryBackend.getSnapshot()),

  approveShortage: ({ id, approvedBy }) => mockFactoryBackend.approveShortage(id, approvedBy),
  rejectShortage: ({ id }) => mockFactoryBackend.rejectShortage(id),

  overrideLineStock: ({ lineId, verdict, by }) =>
    mockFactoryBackend.overrideLineStock(lineId, verdict, by),
  submitDetectionFeedback: (input) => mockFactoryBackend.submitDetectionFeedback(input),

  fetchCameras: () => delayed(() => mockFactoryBackend.getCameras()),

  fetchPermissions: () => delayed(() => mockFactoryBackend.getPermissions()),
  updatePermissions: (input) => delayed(() => mockFactoryBackend.setPermissions(input)),

  fetchInventoryHistory: ({ lineId }) =>
    delayed(() => mockFactoryBackend.getInventoryHistory(lineId)),
};

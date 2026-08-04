import type { ApiClient } from '../api/ApiClient';
import { mockFactoryBackend } from './mockFactoryBackend';

mockFactoryBackend.start();

export const mockApiClient: ApiClient = {
  fetchSnapshot: () => Promise.resolve(mockFactoryBackend.getSnapshot()),
  approveShortage: (id, approvedBy) => mockFactoryBackend.approveShortage(id, approvedBy),
  rejectShortage: (id) => mockFactoryBackend.rejectShortage(id),
};

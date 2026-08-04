import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { factoryApi } from '../api';
import type { ApiError } from '../api/ApiError';
import type { Snapshot } from '../domain/schemas';
import type { Line, RobotStatus, ShortageEvent } from '../domain/types';
import { queryKeys } from './queryKeys';

/**
 * 캐시에 담기는 정규화된 형태.
 *
 * 서버는 배열로 주지만 캐시는 id 맵으로 들고 있는다.
 * 실시간 메시지가 "특정 id 하나"를 갱신하기 때문에, 맵이어야
 * O(1)로 교체하면서 나머지 항목의 참조를 그대로 유지할 수 있다.
 * (참조가 유지되어야 구독 컴포넌트가 불필요하게 리렌더되지 않는다)
 */
export interface FactoryData {
  lines: Record<string, Line>;
  robots: Record<string, RobotStatus>;
  shortageEvents: Record<string, ShortageEvent>;
}

export function normalizeSnapshot(snapshot: Snapshot): FactoryData {
  return {
    lines: Object.fromEntries(snapshot.lines.map((line) => [line.id, line])),
    robots: Object.fromEntries(snapshot.robots.map((robot) => [robot.robotId, robot])),
    shortageEvents: Object.fromEntries(snapshot.shortageEvents.map((event) => [event.id, event])),
  };
}

/**
 * select 함수는 모듈 최상위에 고정한다.
 * 훅 안에서 인라인으로 만들면 렌더마다 새 함수가 되어 Query가 select를 매번 다시 실행한다.
 */
const selectLines = (data: FactoryData) => data.lines;
const selectRobots = (data: FactoryData) => data.robots;
const selectShortageEvents = (data: FactoryData) => data.shortageEvents;

/** 데이터가 아직 없을 때 돌려줄 빈 값. 렌더마다 새 객체를 만들지 않도록 고정한다. */
const EMPTY: Readonly<Record<string, never>> = Object.freeze({});

type FactorySelection<T> = Omit<
  UseQueryOptions<FactoryData, ApiError, T, ReturnType<typeof queryKeys.factory.snapshot>>,
  'queryKey' | 'queryFn'
>;

/**
 * 스냅샷 쿼리 하나가 라인·로봇·부족 이벤트 전체를 담당한다.
 *
 * 정규화는 queryFn 안에서 끝낸다. 캐시에 배열을 담고 select에서 맵으로 바꾸면
 * 실시간 메시지가 캐시를 갱신할 때마다 전체를 다시 정규화해야 한다.
 *
 * 백엔드가 `/lines`, `/robots`처럼 엔드포인트를 쪼개면
 * 아래 use* 훅을 각자의 useQuery로 바꾸면 된다.
 * 컴포넌트가 쓰는 시그니처는 그대로라 화면 코드는 손대지 않는다.
 */
function useFactoryQuery<T>(options: FactorySelection<T>) {
  return useQuery({
    queryKey: queryKeys.factory.snapshot(),
    queryFn: async ({ signal }): Promise<FactoryData> =>
      normalizeSnapshot(await factoryApi.fetchSnapshot(signal)),
    ...options,
  });
}

export function useLines() {
  const { data, isPending, isError, error, refetch } = useFactoryQuery({
    select: selectLines,
  });
  return { lines: data ?? (EMPTY as Record<string, Line>), isPending, isError, error, refetch };
}

export function useRobots() {
  const { data, isPending, isError, error } = useFactoryQuery({ select: selectRobots });
  return { robots: data ?? (EMPTY as Record<string, RobotStatus>), isPending, isError, error };
}

export function useShortageEvents() {
  const { data, isPending, isError, error } = useFactoryQuery({ select: selectShortageEvents });
  return {
    shortageEvents: data ?? (EMPTY as Record<string, ShortageEvent>),
    isPending,
    isError,
    error,
  };
}

/**
 * 부팅 상태만 알고 싶은 곳(스플래시)에서 쓴다.
 * select를 주지 않으면 캐시 전체가 바뀔 때마다 리렌더되므로,
 * 데이터를 쓰지 않는 화면에서만 사용한다.
 */
export function useFactoryDataStatus() {
  const { isPending, isError, error, refetch } = useFactoryQuery({ select: selectLines });
  return { isPending, isError, error, refetch };
}

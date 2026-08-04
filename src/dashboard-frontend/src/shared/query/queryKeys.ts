/**
 * 쿼리 키 팩토리.
 *
 * 키를 문자열 리터럴로 흩뿌리면 무효화(invalidate) 대상이 어긋나기 쉽다.
 * 계층 구조로 두면 상위 키 하나로 하위 전체를 무효화할 수 있다.
 *   queryClient.invalidateQueries({ queryKey: queryKeys.factory.all })
 *
 * as const 를 붙여 키 배열이 리터럴 튜플 타입이 되게 한다.
 * (useQuery의 제네릭 추론과 setQueryData의 타입 안전성에 필요)
 */
export const queryKeys = {
  factory: {
    all: ['factory'] as const,
    /** 라인·로봇·부족 이벤트를 담은 정규화된 캐시 한 덩어리 */
    snapshot: () => [...queryKeys.factory.all, 'snapshot'] as const,
  },

  cameras: {
    all: ['cameras'] as const,
    list: () => [...queryKeys.cameras.all, 'list'] as const,
  },

  settings: {
    all: ['settings'] as const,
    permissions: () => [...queryKeys.settings.all, 'permissions'] as const,
  },

  inventory: {
    all: ['inventory'] as const,
    history: (lineId: string) => [...queryKeys.inventory.all, 'history', lineId] as const,
  },
} as const;

import type { AsyncStorageLike } from './types'
import { createStore, del, get, set } from 'idb-keyval'

/**
 * use IndexedDB storage with `idb-keyval`
 * @param name `idb-keyval` CustomStore db name, default to `solid-idb`
 * @example
 * ```ts
 * import { createIdbStorage, usePersist } from '@solid-hooks/persist'
 * import { createSignal } from 'solid-js'
 *
 * const idbStorage = createIdbStorage('custom-store-name')
 * const [time, setTime] = usePersist(createSignal(Date.now()), 'time', {
 *   storage: idbStorage,
 *   // ...
 * }),
 * ```
 */
export function createIdbStorage(name = 'solid-idb'): AsyncStorageLike {
  const customStore = createStore(name, `${name}-store`)
  return {
    getItem: key => get(key, customStore) as any,
    setItem: (key, val) => set(key, val, customStore),
    removeItem: key => del(key, customStore),
  }
}

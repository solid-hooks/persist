import { createStore, type del as idbDel, type get as idbGet, type set as idbSet } from 'idb-keyval'
import type { AsyncStorageLike } from './types'

/**
 * use IndexedDB storage with `idb-keyval`
 * @param get `idb-keyval` get
 * @param set `idb-keyval` set
 * @param del `idb-keyval` del
 * @param name `idb-keyval` CustomStore db name, default to `solid-idb`
 * @example
 * ```ts
 * import { createIdbStorage, usePersist } from '@solid-hooks/persist'
 * import { createSignal } from 'solid-js'
 * import { del, get, set } from 'idb-keyval'
 *
 * const idbStorage = createIdbStorage(get, set, del, 'custom-store-name')
 * const [time, setTime] = usePersist(createSignal(Date.now()), 'time', {
 *   storage: idbStorage,
 *   // ...
 * }),
 * ```
 */

export function createIdbStorage(
  get: typeof idbGet,
  set: typeof idbSet,
  del: typeof idbDel,
  name = 'solid-idb',
): AsyncStorageLike {
  const customStore = createStore(name, `${name}-store`)
  return {
    getItem: key => get(key, customStore) as any,
    setItem: (key, val) => set(key, val, customStore),
    removeItem: key => del(key, customStore),
  }
}

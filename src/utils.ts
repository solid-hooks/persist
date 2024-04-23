import type { Promisable } from '@subframe7536/type-utils'
import { DEV } from 'solid-js'
import type { AnyStorage } from './types'
import type { PersistenceSyncAPI } from './sync'

export function maybePromise<T>(maybePromise: Promisable<T>, cb: (data: T) => void) {
  maybePromise instanceof Promise ? maybePromise.then(cb) : cb(maybePromise)
}

/**
 * init storage and return setter
 */
export function createSetterWithInit(
  serializeState: () => string,
  updateState: (value: string) => void,
  storage: AnyStorage,
  key: string,
  sync?: PersistenceSyncAPI,
) {
  let unchanged = 1
  const readStorage = (onRead: (data: string | null) => void) => maybePromise(
    storage.getItem(key),
    data => onRead(data),
  )

  readStorage(old => (old !== null && old !== undefined)
    ? unchanged && updateState(old)
    : storage.setItem(key, serializeState()),
  )

  sync?.[0]((data) => {
    if (
      data.key === key
      && data.newValue
      && (!data.url || (data.url === globalThis.location.href))
      && serializeState() !== data.newValue
    ) {
      updateState(data.newValue)
      storage.setItem(key, data.newValue)
    }
  })

  return () => readStorage((old) => {
    const serialized = serializeState()

    DEV && console.debug(serialized)
    if (old !== serialized) {
      sync?.[1](key, serialized)
      maybePromise(
        storage.setItem(key, serialized),
        () => unchanged && unchanged--,
      )
    }
  })
}

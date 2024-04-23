import { type Path, pathGet, pathSet } from 'object-path-access'
import type { createStore } from 'solid-js/store'
import { reconcile, unwrap } from 'solid-js/store'
import { type createSignal, untrack } from 'solid-js'
import type { MakePropRequired } from '@subframe7536/type-utils'
import type { PersistSignalOptions, PersistStoreOptions } from './types'
import { createSetterWithInit } from './utils'

/**
 * persist `Signal` into storage
 * @example
 * ```ts
 * import { usePersist } from '@solid-hooks/persist'
 * import { createStore } from 'solid-js/store'
 *
 * const [signal, setSignal] = usePersist(createSignal('initial'), 'foo', { storage: sessionStorage })
 * ```
 */
export function usePersist<T>(
  signal: ReturnType<typeof createSignal<T>>,
  key: string,
  options: PersistSignalOptions<T>,
): ReturnType<typeof createSignal<T>>
/**
 * persist `Store` into storage, support partial serialize
 * @example
 * ```ts
 * import { usePersist } from '@solid-hooks/persist'
 * import { createStore } from 'solid-js/store'
 *
 * const [store, setStore] = usePersist(
 *   createStore({ bar: 'initial', test: { foo: 'initial' } }),
 *   'testing',
 *   { paths: ['test.foo'] }
 * )
 * ```
 */
export function usePersist<T extends object, Paths extends Path<T>[]>(
  store: ReturnType<typeof createStore<T>>,
  key: string,
  options: PersistStoreOptions<T, Paths>,
): ReturnType<typeof createStore<T>>
export function usePersist<T extends object, Paths extends Path<T>[]>(
  val: any,
  key: string,
  options: PersistStoreOptions<T, Paths> = {},
) {
  return typeof val[0] === 'object'
    ? usePersistStore(val, key, options)
    : usePersistSignal(val, key, options)
}

function setDefaultOptions<T extends object, Paths extends Path<T>[]>(
  options: PersistStoreOptions<T, Paths>,
): MakePropRequired<PersistStoreOptions<any>, 'serializer' | 'storage'>
function setDefaultOptions<T>(
  options: PersistSignalOptions<T>,
): MakePropRequired<PersistSignalOptions<any>, 'serializer' | 'storage'>
function setDefaultOptions(options: PersistStoreOptions<any> | PersistSignalOptions<any>) {
  return {
    ...options,
    storage: options.storage || localStorage,
    serializer: options.serializer || {
      write: JSON.stringify,
      read: JSON.parse,
    },
  }
}

export function usePersistStore<T extends object, Paths extends Path<T>[]>(
  val: ReturnType<typeof createStore<T>>,
  key: string,
  options: PersistStoreOptions<T, Paths> = {},
): ReturnType<typeof createStore<T>> {
  const [state, setState] = val
  const { paths, serializer: { read, write }, storage, sync } = setDefaultOptions(options)

  const serializeState = () => {
    const currentState = unwrap(state)

    // if no path specified, just serialize the total state
    if (!paths?.length) {
      return write(currentState)
    }

    // otherwise, serialize the partial state
    const obj = {}
    for (const path of paths) {
      pathSet(obj, path as any, pathGet(currentState, path))
    }
    return write(obj)
  }

  const updateState = (value: string) => setState(
    reconcile(Object.assign({}, unwrap(state), read(value)), { merge: true }),
  )

  const setter = createSetterWithInit(serializeState, updateState, storage, key, sync)

  return [
    state,
    (...args: any[]) => {
      setState(...args as [any])
      setter()
    },
  ]
}

export function usePersistSignal<T>(
  val: ReturnType<typeof createSignal<T>>,
  key: string,
  options: PersistSignalOptions<T> = {},
): ReturnType<typeof createSignal<T>> {
  const [state, setState] = val
  const { serializer: { read, write }, storage, sync } = setDefaultOptions(options)

  const serializeState = () => write(untrack(state))
  const updateState = (value: string) => setState(read(value))
  const setter = createSetterWithInit(serializeState, updateState, storage, key, sync)

  return [
    state,
    // @ts-expect-error setter
    (args: any) => {
      const result = setState(args)
      setter()
      return result
    },
  ]
}

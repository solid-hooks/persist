import type { Path, PathValue } from 'object-path-access'
import type { PersistenceSyncAPI } from './sync'

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export type AsyncStorageLike = {
  [K in keyof StorageLike]: (...args: Parameters<StorageLike[K]>) => Promise<ReturnType<StorageLike[K]>>
}

export type AnyStorage = StorageLike | AsyncStorageLike

export type PersistStoreOptions<T extends object, Paths extends Path<T>[] = []> = {
  /**
   * localStorage like api, support async
   * @default localStorage
   */
  storage?: AnyStorage
  /**
   * serializer for persist state
   * @default { read: JSON.parse, write: JSON.stringify }
   */
  serializer?: Serializer<FlattenType<PartialObject<T, Paths>>>
  /**
   * object paths to persist
   * @example ['test.deep.data', 'idList[0]']
   */
  paths?: Paths | undefined
  /**
   * sync persisted data,
   * built-in: {@link storageSync}, {@link messageSync}, {@link wsSync}, {@link multiSync}
   */
  sync?: PersistenceSyncAPI
}

export type PersistSignalOptions<T> = Pick<PersistStoreOptions<any>, 'storage' | 'sync'> & {
  /**
   * serializer for persist state
   * @default { read: JSON.parse, write: JSON.stringify }
   */
  serializer?: Serializer<T>
}

type PartialObject<
  T extends object,
  K extends Path<T>[],
  V = Record<string, any>,
> = K['length'] extends 0 ? T : K['length'] extends 1 ? {
  [P in K[0] & string]: PathValue<T, P>;
} : K extends [infer A, ...infer B] ? V & {
  [P in A & string]: PathValue<T, A & string>;
} & (B extends any[] ? PartialObject<T, B, V> : {}) : never

type FlattenType<T> = T extends infer U ? ConvertType<{
  [K in keyof U]: U[K];
}> : never

type ConvertType<T> = {
  [K in keyof T as K extends `${infer A}.${string}` ? A : K]: K extends `${string}.${infer B}`
    ? ConvertType<{ [P in B]: T[K]; }>
    : T[K];
}
/**
 * serializer type for {@link PersistStoreOptions}
 */

export type Serializer<State = unknown> = {
  /**
   * Serializes state into string before storing
   * @default JSON.stringify
   */
  write: (value: State) => string

  /**
   * Deserializes string into state before hydrating
   * @default JSON.parse
   */
  read: (value: string) => State
}

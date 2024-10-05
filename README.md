<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=@solid-hooks/persist&background=tiles&project=%20" alt="@solid-hooks/persist">
</p>

# @solid-hooks/persist

Persist signal or store to storage.

- Provide separate functions for signal and store
- Support multiple sync APIs
- Support partial storage by paths
- Built-in support for `IndexedDB` (please check out that `idb-keyval` is installed)

## Install

```shell
npm i @solid-hooks/persist
```
```shell
yarn add @solid-hooks/persist
```
```shell
pnpm add @solid-hooks/persist
```

## Usage

```ts
import { usePersist } from '@solid-hooks/persist'
import { createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'

const [signal, setSignal] = usePersist(createSignal('initial'), 'foo', { storage: sessionStorage })

const [store, setStore] = usePersist(
  createStore({ bar: 'initial', test: { foo: 'initial' } }),
  'testing',
  { paths: ['test.foo'] }
)
```

standalone usage:

```ts
import { usePersistSignal, usePersistStore } from '@solid-hooks/persist'
import { createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'

const [signal, setSignal] = usePersistSignal(createSignal('initial'), 'foo', { storage: sessionStorage })

const [store, setStore] = usePersistStore(
  createStore({ bar: 'initial', test: { foo: 'initial' } }),
  'testing',
  { paths: ['test.foo'] }
)
```

types:

```ts
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
```

### IndexedDB

use IndexedDB storage with `idb-keyval` (as peerDependencies)

The db name is customizable with prefix `persist-`, default to `solid-idb`

```ts
import { createIdbStorage, usePersist } from '@solid-hooks/persist'
import { createSignal } from 'solid-js'

const idbStorage = createIdbStorage('custom-store-name')
const [time, setTime] = usePersist(createSignal(Date.now()), 'time', {
  storage: idbStorage,
}),
```

### Sync API

The storage API has an interesting functionality: if you set an item in one instance of the same page, other instances are notified of the change via the storage event so they can elect to automatically update.

Same as `@solid-primitives/storage`

#### storageSync

With `storageSync`, you can use exactly this API in order to sync to external updates to the same storage.

```ts
const [state, setState] = usePersist(createSignal(), { sync: storageSync })
```

#### messageSync

With `messageSync`, you can recreate the same functionality for other storages within the client using either the post message API
or broadcast channel API. If no argument is given, it is using post message, otherwise provide the broadcast channel as argument

```ts
const [state, setState] = usePersist(createSignal(), {
  storage: customStorage,
  sync: messageSync(),
})
```

#### wsSync

With `wsSync`, you can create your synchronization API based on a web socket connection (either created yourself or by our
`@solid-primitives/websocket` package); this allows synchronization between client and server.

```ts
const [state, setState] = usePersist(createSignal(), { sync: wsSync(makeWs(/**/)) })
```

#### multiplexSync

You can also multiplex different synchronization APIs using multiplexSync:

```ts
const [state, setState] = usePersist(createSignal(), {
  sync: multiplexSync(storageSync, wsSync(ws)),
})
```

#### Custom synchronization API

If you want to create your own sync API, you can use the following pattern:

```ts
export type PersistenceSyncData = {
  key: string
  newValue: string | null | undefined
  timeStamp: number
  url?: string
}

export type PersistenceSyncCallback = (data: PersistenceSyncData) => void

export type PersistenceSyncAPI = [
  /** subscribes to sync */
  subscribe: (subscriber: PersistenceSyncCallback) => void,
  update: (key: string, value: string | null | undefined) => void,
]
```

You can use APIs like Pusher or a WebRTC data connection to synchronize your state.

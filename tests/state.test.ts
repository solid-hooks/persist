import { createSignal } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'
import { describe, expect, it } from 'vitest'
import { usePersist } from '../src'

describe('test state', () => {
  it('should persist state to storage', async () => {
    const kv = new Map()
    const key = 'state-test-persist'
    kv.set(key, 2)
    const [val, setVal] = usePersist(createSignal(1), key, {
      storage: {
        getItem(key) {
          return kv.get(key)
        },
        setItem(key, value) {
          kv.set(key, value)
        },
        removeItem(key) {
          kv.delete(key)
        },
      },
    })
    expect(val()).toBe(2)
    expect(kv.get(key)).toBe(2)

    setVal(3)
    expect(val()).toBe(3)
    expect(kv.get(key)).toBe('3')
  })

  it('should persist state to storage by paths', async () => {
    const initialState = {
      persist: { count: 0, noPersist: 'data' },
      partialPersist: ['test', 'test1'],
    }
    const kv = new Map()
    const key = 'state-test-persist-optional'
    const [, setVal] = usePersist(
      createStore(initialState),
      key,
      {
        storage: {
          async getItem(key) {
            return kv.get(key)
          },
          async setItem(key, value) {
            kv.set(key, value)
          },
          async removeItem(key) {
            kv.delete(key)
          },
        },
        paths: ['persist.count', 'partialPersist[0]'],
      },
    )

    await Promise.resolve()
    expect(kv.get(key)).toBe('{"persist":{"count":0},"partialPersist":["test"]}')

    setVal(reconcile({ persist: { count: 1, noPersist: 'data' }, partialPersist: ['test'] }))
    await Promise.resolve()
    expect(kv.get(key)).toBe('{"persist":{"count":1},"partialPersist":["test"]}')

    setVal(reconcile({ persist: { count: 0, noPersist: 'data1' }, partialPersist: ['test1'] }))
    await Promise.resolve()
    expect(kv.get(key)).toBe('{"persist":{"count":0},"partialPersist":["test1"]}')
  })
})

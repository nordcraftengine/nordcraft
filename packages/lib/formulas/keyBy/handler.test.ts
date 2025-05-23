import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Key by', () => {
  test('should reduce an array of objects ot a single object', () => {
    const list = [
      { name: 'Andreas', role: 'Admin' },
      { name: 'John', role: 'User' },
      { name: 'Bobo', role: 'User' },
    ]
    expect(
      handler([list, (Args: any) => Args.item.role], undefined as any),
    ).toEqual({
      Admin: { name: 'Andreas', role: 'Admin' } as any,
      User: { name: 'Bobo', role: 'User' } as any,
    })
    expect(
      handler([list, (Args: any) => Args.item.name], undefined as any),
    ).toEqual({
      Andreas: { name: 'Andreas', role: 'Admin' } as any,
      John: { name: 'John', role: 'User' } as any,
      Bobo: { name: 'Bobo', role: 'User' } as any,
    })
  })
  test('should return an empty object given an empty array', () => {
    expect(
      handler([[], (Args: any) => Args.item.role], undefined as any),
    ).toEqual({})
  })
})

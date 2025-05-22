import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Group by', () => {
  test('should group an array of objects by key', () => {
    const list = [
      { name: 'Andreas', role: 'Admin' },
      { name: 'John', role: 'User' },
      { name: 'Bobo', role: 'User' },
    ]
    expect(
      handler([list, (Args: any) => Args.item.role], undefined as any),
    ).toEqual({
      Admin: [{ name: 'Andreas', role: 'Admin' }],
      User: [
        { name: 'John', role: 'User' },
        { name: 'Bobo', role: 'User' },
      ],
    })
    expect(
      handler([list, (Args: any) => Args.item.name], undefined as any),
    ).toEqual({
      Andreas: [{ name: 'Andreas', role: 'Admin' }],
      John: [{ name: 'John', role: 'User' }],
      Bobo: [{ name: 'Bobo', role: 'User' }],
    })
  })
  test('should return an empty object given an empty array', () => {
    expect(
      handler([[], (Args: any) => Args.item.role], undefined as any),
    ).toEqual({})
  })
})

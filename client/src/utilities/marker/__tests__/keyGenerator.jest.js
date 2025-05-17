import { generateMarkingKey } from '../keyGenerator';

describe('generateMarkingKey', () => {
  it('generates encoded keys correctly', () => {
    const input = {
      "00000001": {
        0: [0],
        1: [1, 3],
        2: [2, 4],
      }
    };

    const result = generateMarkingKey(input);
    // Explanation:
    // - [0] -> 1 << (4 - 0) = 16 (10000)
    // - [1, 3] -> 1 << 3 = 8, 1 << 1 = 2 => 1010 = 10
    // - [2, 4] -> 1 << 2 = 4, 1 << 0 = 1 => 0101 = 5
    expect(result["00000001"]).toBe('161005');
  });

  it('handles empty input', () => {
    const result = generateMarkingKey({});
    expect(result).toEqual({});
  });
});
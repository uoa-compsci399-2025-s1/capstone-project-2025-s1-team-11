import { generateMarkingKey } from '../keyGenerator';

describe('generateMarkingKey', () => {
  it('generates encoded keys correctly (using 1 << i)', () => {
    const input = {
      "00000001": {
        0: [0],         // A → 1
        1: [1, 3],      // B + D → 10
        2: [2, 4]       // C + E → 20
      }
    };

    const result = generateMarkingKey(input);
    expect(result["00000001"]).toBe('011020');
  });

  it('handles empty input', () => {
    const result = generateMarkingKey({});
    expect(result).toEqual({});
  });

  it('bitmask encoding of correctIndexes maps options A-E to [0–4]', () => {
    const input = {
      "00000001": {
        0: [0], // A
        1: [1], // B
        2: [2], // C
        3: [3], // D
        4: [4]  // E
      }
    };
    const result = generateMarkingKey(input);
    expect(result["00000001"]).toBe('0102040816');
  });
});
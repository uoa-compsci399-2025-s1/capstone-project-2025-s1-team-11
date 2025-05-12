import { readTeleform, readTeleformLine } from '../teleformReader';

describe('readTeleformLine', () => {
  const validLine = "01483316245 VE           BODNIHD 11100000004 0108080108010101041602160116161604160808                                                                                                                                                                    \n";

  it('parses a valid line correctly', () => {
    const result = readTeleformLine(validLine);

    expect(result).toEqual({
      studentId: "483316245",
      lastName: "VE",
      firstName: "BODNIHD",
      versionId: "100000004",
      answerString: "0108080108010101041602160116161604160808"
    });
  });

  it('trims spaces from names and answer string', () => {
    const line = "01722222229 SMITH        BOB     11000000001 1616160201                                     ";
    const result = readTeleformLine(line);

    expect(result.lastName).toBe("SMITH");
    expect(result.firstName).toBe("BOB");
    expect(result.answerString).toBe("1616160201");
  });

  it('throws an error if the line is too short', () => {
    expect(() => readTeleformLine("short")).toThrow("Teleform line too short to parse");
  });
});

describe('readTeleform', () => {
  const input = `
01387333331 BROWN        JOAN    11000000002 0416080216
01722222229 SMITH        BOB     11000000001 1616160201
`;

  it('parses multiple lines correctly', () => {
    const results = readTeleform(input);
    expect(results.length).toBe(2);
    expect(results[0].firstName).toBe("JOAN");
    expect(results[1].lastName).toBe("SMITH");
  });

  it('ignores blank lines', () => {
    const inputWithBlank = `
01387333331 BROWN        JOAN    11000000002 0416080216

01722222229 SMITH        BOB     11000000001 1616160201
`;
    const results = readTeleform(inputWithBlank);
    expect(results.length).toBe(2);
  });
});

describe('readTeleform - multiline input', () => {
  it('parses multiple valid lines separated by newlines', () => {
    const data = `
01483316245 VE           BODNIHD 11100000004 0108080108010101041602160116161604160808
01495289223 RMSC         MZQSCIY 11100000004 0808010104010801020804020104160216040816
01129569112 DCYY         YTKO    11100000004 0808010108011601161602020104160204020804
`.trim();

    const results = readTeleform(data);

    expect(results).toHaveLength(3);
    expect(results[0].studentId).toBe("483316245");
    expect(results[1].firstName).toBe("MZQSCIY");
    expect(results[2].answerString).toBe("0808010108011601161602020104160204020804");
  });

  it('ignores extra blank lines', () => {
    const dataWithBlanks = `

01483316245 VE           BODNIHD 11100000004 0108080108010101041602160116161604160808

01495289223 RMSC         MZQSCIY 11100000004 0808010104010801020804020104160216040816


`;

    const results = readTeleform(dataWithBlanks);
    expect(results).toHaveLength(2);
  });
});
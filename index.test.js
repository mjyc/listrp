// NOTE: missing smapTo, sfilter, sscan, scombineLatest, sstartWith, sdelay, sempty tests

const {
  smap,
  smerge,
  sdebounce,
  sdistinctUntilChanged
} = require("./index.js");

test("smap", () => {
  const input = [{ stamp: 0, value: 0 }, { stamp: 1, value: 1 }];
  const output = smap(x => x + 1, input);
  const expected = [{ stamp: 0, value: 1 }, { stamp: 1, value: 2 }];
  expect(output).toEqual(expected);
});

test("smerge", () => {
  const input1 = [
    { stamp: 0, value: 0 },
    { stamp: 3, value: 1 },
    { stamp: 6, value: 2 }
  ];
  const input2 = [
    { stamp: 1, value: 3 },
    { stamp: 4, value: 4 },
    { stamp: 7, value: 5 }
  ];
  const input3 = [
    { stamp: 2, value: 6 },
    { stamp: 5, value: 7 },
    { stamp: 8, value: 8 }
  ];
  const output = smerge(input1, input2, input3);
  const expected = [
    { stamp: 0, value: 0 },
    { stamp: 1, value: 3 },
    { stamp: 2, value: 6 },
    { stamp: 3, value: 1 },
    { stamp: 4, value: 4 },
    { stamp: 5, value: 7 },
    { stamp: 6, value: 2 },
    { stamp: 7, value: 5 },
    { stamp: 8, value: 8 }
  ];
  expect(output).toEqual(expected);
});

test("sdebounce", () => {
  const input = [
    { stamp: 0, value: 0 },
    { stamp: 10, value: 1 },
    { stamp: 20, value: 2 },
    { stamp: 30, value: 3 },
    { stamp: 40, value: 4 },
    { stamp: 50, value: 5 },
    { stamp: 60, value: 6 },
    { stamp: 70, value: 7 },
    { stamp: 80, value: 8 },
    { stamp: 90, value: 9 }
  ];
  const output = sdebounce(x => x * 2, input);
  const expected = [
    { stamp: 0, value: 0 },
    { stamp: 12, value: 1 },
    { stamp: 24, value: 2 },
    { stamp: 36, value: 3 },
    { stamp: 48, value: 4 },
    { stamp: 108, value: 9 }
  ];
  expect(output).toEqual(expected);

  const input2 = [
    { stamp: 0, value: 0 },
    { stamp: 10, value: 1 },
    { stamp: 20, value: 2 },
    { stamp: 30, value: 3 },
    { stamp: 40, value: 4 },
    { stamp: 50, value: 5 },
    { stamp: 60, value: 6 },
    { stamp: 70, value: 7 },
    { stamp: 80, value: 8 },
    { stamp: 90, value: 9 }
  ];
  const output2 = sdebounce(x => 5, input2);
  const expected2 = [
    { stamp: 5, value: 0 },
    { stamp: 15, value: 1 },
    { stamp: 25, value: 2 },
    { stamp: 35, value: 3 },
    { stamp: 45, value: 4 },
    { stamp: 55, value: 5 },
    { stamp: 65, value: 6 },
    { stamp: 75, value: 7 },
    { stamp: 85, value: 8 },
    { stamp: 95, value: 9 }
  ];
  expect(output2).toEqual(expected2);
});

describe("sdistinctUntilChanged", () => {
  test("removing duplicates", () => {
    const expected = [
      { stamp: 0, value: 0 },
      { stamp: 20, value: 1 },
      { stamp: 40, value: 2 },
      { stamp: 60, value: 3 },
      { stamp: 80, value: 4 }
    ];
    const input = [
      { stamp: 0, value: 0 },
      { stamp: 10, value: 0 },
      { stamp: 20, value: 1 },
      { stamp: 30, value: 1 },
      { stamp: 40, value: 2 },
      { stamp: 50, value: 2 },
      { stamp: 60, value: 3 },
      { stamp: 70, value: 3 },
      { stamp: 80, value: 4 },
      { stamp: 90, value: 4 }
    ];
    const actual = sdistinctUntilChanged((a, b) => a === b, input);
    expect(actual).toEqual(expected);
  });

  test("using input with two same stamps", async () => {
    const expected = [{ stamp: 0, value: 0 }, { stamp: 0, value: 1 }];
    const input = [
      { stamp: 0, value: 0 },
      { stamp: 0, value: 1 },
      { stamp: 10, value: 1 }
    ];
    const actual = sdistinctUntilChanged((a, b) => a === b, input);
    expect(actual).toEqual(expected);
  });
});

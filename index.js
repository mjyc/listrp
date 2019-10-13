const map = require("lodash/fp/map");
const filter = require("lodash/fp/filter");
const reduce = require("lodash/fp/reduce");
const concat = require("lodash/fp/concat");
const sortBy = require("lodash/fp/sortBy");

const smap = (fn, stream) => {
  return map(
    ({ stamp, value }) => ({
      stamp: stamp,
      value: fn(value)
    }),
    stream
  );
};

const smapTo = (x, stream) => {
  return map(
    ({ stamp, value }) => ({
      stamp: stamp,
      value: x
    }),
    stream
  );
};

const sfilter = (fn, stream) => {
  return filter(({ stamp, value }) => !!fn(value), stream);
};

const sscan = (reducer, seed, stream) => {
  return reduce(
    (prev, { stamp, value }) => {
      return concat(prev, {
        stamp: stamp,
        value: reducer(prev[prev.length - 1].value, value)
      });
    },
    [{ stamp: 0, value: seed }],
    stream
  );
};

const smerge = (...argumnets) => {
  const events = reduce((prev, x) => concat(prev, x), [], argumnets);
  return sortBy("stamp", events);
};

const sstartWith = (x, stream) => {
  return concat([{ stamp: 0, value: x }], stream);
};

const sdistinctUntilChanged = (compare, stream) => {
  if (stream.length < 2) {
    return stream;
  } else {
    return reduce(
      (prev, { stamp, value }) =>
        compare(prev[prev.length - 1].value, value)
          ? prev
          : concat(prev, { stamp: stamp, value: value }),
      [stream[0]],
      stream
    );
  }
};

const sdebounce = (fn, stream) => {
  if (stream.length < 2) {
    return stream;
  } else {
    const { candidate, arr } = reduce(
      ({ candidate, arr }, { stamp, value }) => {
        return {
          candidate: {
            stamp: stamp + fn(value),
            value: value
          },
          arr:
            candidate === null
              ? []
              : candidate.stamp < stamp
              ? concat(arr, candidate)
              : arr
        };
      },
      { candidate: null, arr: null },
      stream
    );
    return concat(arr, candidate);
  }
};

const empty = () => [];

module.exports = {
  empty,
  smap,
  smapTo,
  sfilter,
  sscan,
  smerge,
  sstartWith,
  sdistinctUntilChanged,
  sdebounce
};

// NOTE: missing spairwise, stake, sskip, sbuffer, and sthrottle

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

// TODO: update to handle multiple values
const scombineLatest = (stream1, stream2) => {
  return sfilter(
    x => x[0] !== null && x[1] !== null,
    sscan(
      (prev, x) => {
        if (x.index === 0) {
          return [x.value, prev[1]];
        } else if (x.index === 1) {
          return [prev[0], x.value];
        } else {
          return prev;
        }
      },
      [null, null],
      smerge(
        smap(x => ({ value: x, index: 0 }), stream1),
        smap(x => ({ value: x, index: 1 }), stream2)
      )
    )
  );
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

const sdelay = (period, stream) => {
  return map(
    ({ stamp, value }) => ({ stamp: stamp + (period < 0 ? 0 : period), value }),
    stream
  );
};

const sdebounce = (fn, stream) => {
  if (stream.length < 2) {
    return stream;
  } else {
    const { candidate, arr } = reduce(
      ({ candidate, arr }, { stamp, value }) => {
        const period = fn(value);
        return {
          candidate: {
            stamp: stamp + (period < 0 ? 0 : period),
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

const sempty = () => [];

module.exports = {
  // default
  smap,
  smapTo,
  sfilter,
  sscan,
  smerge,
  scombineLatest,
  sstartWith,
  sdistinctUntilChanged,
  sdelay,
  sdebounce,
  sempty
};

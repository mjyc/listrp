const map = require("lodash/fp/map");
const filter = require("lodash/fp/filter");
const reduce = require("lodash/fp/reduce");
const sortBy = require("lodash/fp/sortBy");

var smap = function(fn, stream) {
  return map(
    ({ stamp, value }) => ({
      stamp: stamp,
      value: fn(value)
    }),
    stream
  );
};

var smapTo = function(x, stream) {
  return map(
    ({ stamp, value }) => ({
      stamp: stamp,
      value: x
    }),
    stream
  );
};

var sfilter = function(fn, stream) {
  return filter(({ stamp, value }) => !!fn(value), stream);
};

var sscan = function(reducer, seed, stream) {
  return reduce(
    (prev, { stamp, value }) => {
      return prev.concat({
        stamp: stamp,
        value: reducer(prev[prev.length - 1].value, value)
      });
    },
    [{ stamp: 0, value: seed }],
    stream
  );
};

var smerge = function() {
  const streams = arguments;
  return sort([].concat.apply([], streams), (a, b) => a < b, x => x.stamp);
};

var sstartWith = function(x, stream) {
  return [{ stamp: 0, value: x }].concat(stream);
};

var sdistinctUntilChanged = function(compare, stream) {
  if (stream.length < 2) {
    return stream;
  } else {
    return reduce(
      (prev, { stamp, value }) =>
        compare(prev[prev.length - 1].value, value)
          ? prev
          : prev.concat({ stamp: stamp, value: value }),
      [stream[0]],
      stream
    );
  }
};

var sdebounce = function(fn, stream) {
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
              ? arr.concat(candidate)
              : arr
        };
      },
      { candidate: null, arr: null },
      stream
    );
    return arr.concat(candidate);
  }
};

module.exports = {
  smap,
  sscan,
  sstartWith,
  sdistinctUntilChanged,
  sdebounce
};

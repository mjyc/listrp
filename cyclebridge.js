// TODO: rename debounce2 to debounceFn

const xs = require("xstream").default;
const cycleTime = require("@cycle/time");
const { share } = require("./streams");

const convertRecordedStreamToCycleTimeRecordedStream = recorded => {
  return recorded.map(x => ({
    type: "next",
    value: x.value,
    time: x.stamp
  }));
};

const convertCycleTimeRecordedStreamToRecordedStream = cycleTimeRecorded => {
  return cycleTimeRecorded.map(x => ({
    value: x.value,
    stamp: x.time
  }));
};

const convertRecordedStreamToXStream = (Time, recorded) => {
  const cycleTimeRecorded = convertRecordedStreamToCycleTimeRecordedStream(
    recorded
  );
  const schedule = Time._scheduler;
  return xs.create({
    start: listener => {
      cycleTimeRecorded.map(({ value, time }) => {
        schedule.next(listener, time, value);
      });
    },
    stop: () => {}
  });
};

const convertRecordedStreamToStream = (Time, recorded) => {
  return fromXStream(convertRecordedStreamToXStream(Time, recorded));
};

const toXStream = stream => {
  let unsubscribe = () => {};

  return xs.create({
    start: listener => {
      unsubscribe = stream(ev => listener.next(ev));
    },

    stop: () => {
      unsubscribe();
    }
  });
};

const fromXStream = in$ => {
  return share(cb => {
    const listener = { next: val => cb(val) };
    in$.addListener(listener);
    return () => {
      in$.removeListener(listener);
    };
  });
};

// https://github.com/cyclejs/cyclejs/tree/master/time#mocktimesourceinterval
// https://github.com/cyclejs/cyclejs/blob/master/time/src/time-source.ts#L18-L27
const mockTimeSource = (...args) => {
  const Time = cycleTime.mockTimeSource(...args);
  return {
    diagram: (diagramString, values) =>
      fromXStream(Time.diagram(diagramString, values)),
    record: stream =>
      fromXStream(
        Time.record(toXStream(stream)).map(
          convertCycleTimeRecordedStreamToRecordedStream
        )
      ),
    assertEqual: (actual, expected, comparator) =>
      Time.assertEqual(toXStream(actual), toXStream(expected), comparator),
    periodic: period => fromXStream(Time.periodic(period)),
    run: Time.run,
    _time: Time._time,
    _scheduler: Time._scheduler,
    debounce2: (fn, stream) => {
      const in$ = toXStream(stream);
      return fromXStream(
        in$
          .map(x => {
            return xs.of(x).compose(Time.delay(fn(x)));
          })
          .flatten()
      );
    }
  };
};

module.exports = {
  convertRecordedStreamToCycleTimeRecordedStream,
  convertRecordedStreamToXStream,
  convertRecordedStreamToStream,
  toXStream,
  fromXStream,
  mockTimeSource
};

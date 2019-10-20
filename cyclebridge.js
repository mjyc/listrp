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
    stamp: x.time,
    value: x.value
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
    delay: (period, stream) => {
      const in$ = toXStream(stream);
      return fromXStream(in$.compose(Time.delay(period)));
    },
    debounce: (fn, stream) => {
      const in$ = toXStream(stream);
      if (typeof fn === "number") {
        // fn is period
        return fromXStream(in$.compose(Time.debounce(fn)));
      }
      return fromXStream(
        in$
          .map(x => {
            return xs.of(x).compose(Time.delay(fn(x)));
          })
          .flatten()
      );
    },
    periodic: period => fromXStream(Time.periodic(period)),
    throttle: (period, stream) => {
      const in$ = toXStream(stream);
      return fromXStream(in$.compose(Time.throttle(period)));
    },
    run: Time.run,
    _time: Time._time,
    _scheduler: Time._scheduler
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

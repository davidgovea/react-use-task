import test from 'ava';
import inRange from 'in-range';
import { Future, isDeinitError, isFuture } from 'posterus';
import randomInt from 'random-int';
import timeSpan from 'time-span';

import futureQueue from './queue';

const delay = (ms: number): Future => {
  const future = new Future();
  setTimeout(() => future.settle(), ms);
  return future;
};

test('concurrency: 1', async t => {
  const input = [[10, 300], [20, 200], [30, 100]];

  const end = timeSpan();
  const limit = futureQueue(1);

  const mapper = ([value, ms]) => limit(() => delay(ms).mapResult(() => value));

  const result = await Future.all(input.map(mapper));
  t.deepEqual(result, [10, 20, 30]);
  t.true(inRange(end(), { start: 590, end: 650 }));
});

test('concurrency: 4', async t => {
  const concurrency = 5;
  let running = 0;

  const limit = futureQueue(concurrency);

  const input = Array.from({ length: 100 }, () =>
    limit(() => {
      running++;
      t.true(running <= concurrency);
      const future = delay(randomInt(30, 200));
      running--;
      return future;
    })
  );

  await Future.all(input).toPromise();
});

test('non-future returning function', async t => {
  await t.notThrowsAsync(() => {
    const limit = futureQueue(1);
    return limit(() => null).toPromise();
  });
});

test('continues after sync throw', async t => {
  const limit = futureQueue(1);
  let ran = false;

  const futures = [
    limit(() => {
      throw new Error('err');
    }),
    limit(() => {
      ran = true;
    })
  ];

  await Future.all(futures)
    .mapError(() => undefined)
    .toPromise();

  t.is(ran, true);
});

test('accepts additional arguments', async t => {
  const limit = futureQueue(1);
  const symbol = Symbol('test');

  await limit(a => t.is(a, symbol), symbol);
});

test('does not ignore errors', async t => {
  const limit = futureQueue(1);
  const error = new Error('🦄');

  const futures = [
    limit(() => delay(30)),
    limit(() =>
      delay(80).map(() => {
        throw error;
      })
    ),
    limit(() => delay(50))
  ];

  await t.throwsAsync(Future.all(futures).toPromise(), { is: error });
});

test('activeCount and pendingCount properties', async t => {
  const limit = futureQueue(5);
  t.is(limit.activeCount, 0);
  t.is(limit.pendingCount, 0);

  const runningFuture1 = limit(() => delay(1000));
  t.is(limit.activeCount, 1);
  t.is(limit.pendingCount, 0);

  await runningFuture1.toPromise();
  t.is(limit.activeCount, 0);
  t.is(limit.pendingCount, 0);

  const immediateFutures = Array.from({ length: 5 }, () =>
    limit(() => delay(1000))
  );
  const delayedFutures = Array.from({ length: 3 }, () =>
    limit(() => delay(1000))
  );

  t.is(limit.activeCount, 5);
  t.is(limit.pendingCount, 3);

  await Future.all(immediateFutures).toPromise();
  t.is(limit.activeCount, 3);
  t.is(limit.pendingCount, 0);

  await Future.all(delayedFutures).toPromise();

  t.is(limit.activeCount, 0);
  t.is(limit.pendingCount, 0);
});

test('oldestRunning property', async t => {
  const limit = futureQueue(1);
  t.is(limit.oldestRunning, undefined);

  const runningFuture1 = limit(() => delay(1000));
  t.true(isFuture(limit.oldestRunning));
});

test('empty method', async t => {
  const limit = futureQueue(3);

  const futures = Array.from({ length: 5 }, () => limit(() => delay(1000)));
  t.is(limit.activeCount, 3);
  t.is(limit.pendingCount, 2);

  limit.empty();
  t.is(limit.activeCount, 3);
  t.is(limit.pendingCount, 0);
});

test('cancellAll method', async t => {
  const limit = futureQueue(3);

  const end = timeSpan();
  const futures = Array.from({ length: 3 }, () => limit(() => delay(1000)));

  limit.cancelAll();

  await Future.all(futures)
    .mapError(error => {
      const isDeinit = isDeinitError(error);
      t.true(isDeinit);
      return Future.fromResult(undefined);
    })
    .toPromise();

  t.true(inRange(end(), { start: 0, end: 50 }), 'Tasks were cancelled');
});

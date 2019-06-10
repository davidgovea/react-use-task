import { Future } from 'posterus';

// Adapted from
// https://github.com/sindresorhus/p-limit
// for posterus futures. Added cancelAll & active list tracking

const fTry = (fn, ...args: any[]) => {
  const future = new Future();
  try {
    const result = fn(...args);
    future.settle(undefined, result);
  } catch (error) {
    future.settle(error);
  }
  return future;
};

type AnyFn<T = any> = (...args: any[]) => T;

// tslint:disable-next-line typedef
export function futureQueue(
  concurrency: number
): AnyFn<Future> & {
  activeCount: number;
  pendingCount: number;
  oldestRunning: Future;
  empty: () => void;
  cancelAll: () => void;
} {
  const queue = [];
  const activeList = [];
  let activeCount = 0; // tslint:disable-line no-let

  const next = () => {
    activeCount--;

    if (queue.length > 0) {
      queue.shift()();
    }
  };

  const run = (fn: AnyFn, settle: Future['settle'], ...args: any[]) => {
    activeCount++;

    const future = fTry(fn, ...args)
      .finally(() => activeList.splice(activeList.indexOf(future), 1))
      .finally(next)
      .map(settle);

    activeList.push(future);
  };

  const enqueue = (
    fn: (...args: any[]) => Future,
    settle: Future['settle'],
    ...args: any[]
  ) => {
    if (activeCount < concurrency || concurrency <= 0) {
      run(fn, settle, ...args);
    } else {
      queue.push(run.bind(null, fn, settle, ...args));
    }
  };

  const generator = (fn: (...args: any[]) => Future, ...args: any[]) => {
    const future = new Future();
    enqueue(fn, future.settle.bind(future), ...args);
    return future;
  };
  Object.defineProperties(generator, {
    activeCount: {
      get: () => {
        return activeCount;
      }
    },
    pendingCount: {
      get: () => queue.length
    },
    cancelAll: {
      value: () => {
        queue.splice(0, queue.length);
        for (const active of [...activeList]) {
          active.deinit();
        }
      }
    },
    empty: {
      value: () => {
        queue.splice(0, queue.length);
      }
    },
    oldestRunning: {
      get: () => activeList[0]
    }
  });

  return generator as any;
}

export default futureQueue;

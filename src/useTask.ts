import { Future } from 'posterus';
import { fiber } from 'posterus/fiber';
import { DependencyList, useCallback, useEffect, useState } from 'react';

interface TaskInstanceBase<T> {
  isSuccessful: boolean;
  isError: boolean;
  error?: Error;
  value?: T;
  // future?: Posterus.Future<any>
}
interface TaskInstanceError<T> extends TaskInstanceBase<T> {
  isSuccessful: false;
  isError: true;
  error: Error;
  value: T;
}
interface TaskInstanceSuccess<T> extends TaskInstanceBase<T> {
  isSuccessful: true;
  isError: false;
  error: undefined;
  value: undefined;
}
type TaskInstance<T> = (
  | TaskInstanceBase<T>
  | TaskInstanceError<T>
  | TaskInstanceSuccess<T>) & {
  toPromise: () => Promise<T>;
  cancel: () => void;
  deref: () => T | undefined;
};

export interface TaskState<T> {
  isRunning: boolean;
  isIdle: boolean;
  performCount: number;
  last?: TaskInstance<T>;
  lastSuccessful?: TaskInstance<T>;
}

type TaskValues<T, A extends any[]> = [
  TaskState<T>,
  (...args: A) => TaskInstance<T>,
  () => void
];

interface TaskOptions {
  mode?: 'drop' | 'restartable' | 'takeLatest' | 'enqueue';
  maxConcurrency?: number;
}

export function useTask<Result = any, Args extends any[] = any[]>(
  taskFn: (...args: Args) => IterableIterator<Result>,
  deps: DependencyList = [],
  options: TaskOptions = {}
): TaskValues<Result, Args> {
  const [isRunning, setIsRunning] = useState(false);
  const [performCount, setPerformCount] = useState(0);
  const [last, setLast] = useState<TaskInstance<Result>>();
  const [lastSuccessful, setLastSuccessful] = useState<TaskInstance<Result>>();

  const [currentFuture, setCurrent] = useState<Future>();

  const cancelAll = useCallback((/*...args: Args*/) => {
    // tslint:disable-next-line:no-unused-expression
    currentFuture && currentFuture.deinit();
  }, [currentFuture]);

  useEffect(() => () => cancelAll(), [currentFuture]);

  const perform = useCallback(
    (...args: Args): TaskInstance<Result> => {
      setPerformCount(performCount + 1);
      if (currentFuture) {
        // Using 'drop' strategy here
        return {
          isError: false,
          isSuccessful: false,
          value: undefined,
          toPromise: () => Promise.resolve(undefined),
          cancel: () => undefined
        };
      } else {
        const future = fiber<Result>(taskFn(...args));
        const promise = future.weak().toPromise();

        const taskInstance = {
          isError: false,
          isSuccessful: false,
          toPromise: () => promise,
          cancel: () => future.deinit()
        };
        setCurrent(future);
        setIsRunning(true);
        setLast(taskInstance);
        future
          .weak()
          .mapResult((result: Result) => {
            const updatedLastTask: TaskInstance<Result> = {
              ...last,
              isSuccessful: true,
              value: result
            };
            setLast(updatedLastTask);
            setLastSuccessful(updatedLastTask);
          })
          .mapError((error: Error) => {
            setLast({
              ...last,
              isError: true,
              error
            });
          })
          .finally(() => {
            setIsRunning(false);
            setCurrent(undefined);
          });

        return taskInstance;
      }
    },
    [...deps, currentFuture, isRunning, last, lastSuccessful, performCount]
  );

  return [
    {
      isRunning,
      isIdle: !isRunning,
      last,
      lastSuccessful,
      performCount
    },
    perform,
    cancelAll
  ];
}

export default useTask;

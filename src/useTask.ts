import { Future, isDeinitError } from 'posterus';
import { fiber } from 'posterus/fiber';
import {
  DependencyList,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';
import useCounter from 'react-use/esm/useCounter';

import { fLimit } from './lib/f-limit';

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
  mode?: 'drop' | 'restartable' | 'enqueue';
  maxConcurrency?: number;
}

const initialTaskInstance: TaskInstance<any> = {
  isSuccessful: false,
  isError: false,
  deref: () => undefined,
  toPromise: () => Promise.resolve(undefined),
  cancel: () => undefined
};

function createTaskInstance<T>(future: Future<T>): TaskInstance<T> {
  return {
    ...initialTaskInstance,
    deref: () => future.deref(),
    toPromise: () => future.weak().toPromise(),
    cancel: () => future.deinit()
  };
}

export function useTask<Result = any, Args extends any[] = any[]>(
  taskFn: (...args: Args) => IterableIterator<Result>,
  deps: DependencyList = [],
  options: TaskOptions = {}
): TaskValues<Result, Args> {
  const mode = options.mode || 'enqueue';
  const maxConcurrency = options.maxConcurrency || (options.mode ? 1 : 0);

  const [isRunning, setIsRunning] = useState(false);
  const [performCount, { inc: incPerformCount }] = useCounter(0);
  const [lastState, setLastState] = useState<TaskInstance<Result>>();
  const [lastSuccessful, setLastSuccessful] = useState<TaskInstance<Result>>();

  const queue = useRef(fLimit(maxConcurrency));

  const last = useRef<TaskInstance<Result>>();
  const setLast = useCallback(
    (l: TaskInstance<Result>) => {
      last.current = l;
      setLastState(l);
    },
    [lastState]
  );

  const cancelAll = useCallback((/*...args: Args*/) => {
    // tslint:disable-next-line no-unused-expression
    queue.current.cancelAll();
  }, []);

  useEffect(() => cancelAll, []);

  const runTask = useCallback((...args: Args): Future<Result | undefined> => {
    // tslint:disable-next-line no-let
    let taskInstance: TaskInstance<Result>;
    // const future = fiber<Result>(taskFn(...args));
    const future = fiber<Result>(taskFn(...args)).map<Result>(
      (error, value) => {
        if (error) {
          const isDeinit = isDeinitError(error);
          if (last.current === taskInstance) {
            const errorTask = {
              ...taskInstance,
              isError: !isDeinitError(error),
              error
            };
            setLast(errorTask);
          }
          return isDeinit
            ? Future.fromResult(undefined)
            : Future.fromError(error);
        } else {
          const updatedTask = {
            ...taskInstance,
            value,
            isSuccessful: true
          };
          if (last.current === taskInstance) {
            setLast(updatedTask);
          }
          setLastSuccessful(updatedTask);
          return value;
        }
      }
    );

    taskInstance = createTaskInstance(future);
    setLast(taskInstance);
    return future;
  }, deps);

  const perform = useCallback((...args: Args) => {
    incPerformCount();
    setIsRunning(true);

    const isSaturated = queue.current.activeCount >= maxConcurrency;
    if (mode === 'drop' && isSaturated) {
      const instance = { ...initialTaskInstance };
      setLast(instance);
      console.log('dropped');
      return instance;
    }
    if (mode === 'restartable' && isSaturated) {
      console.log('cancelling oldest running task');
      try {
        queue.current.activeList[0].deinit();
      } catch (e) {
        debugger;
      }
    }
    const future = queue
      .current(() => runTask(...args))
      .mapError(error => {
        const isDeinit = isDeinitError(error);
        return isDeinit
          ? Future.fromResult(undefined)
          : Future.fromError(error);
      })
      .finally(() => {
        setIsRunning(queue.current.activeCount !== 0);
      });
    return createTaskInstance(future);
  }, deps);

  return [
    {
      isRunning,
      isIdle: !isRunning,
      last: lastState,
      lastSuccessful,
      performCount
    },
    perform,
    cancelAll
  ];
}

export default useTask;

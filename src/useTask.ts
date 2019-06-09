import { Future, isDeinitError } from 'posterus';
import { fiber } from 'posterus/fiber';
import {
  DependencyList,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';

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
  const [isRunning, setIsRunning] = useState(false);
  const [performCount, setPerformCount] = useState(0);
  const [lastState, setLastState] = useState<TaskInstance<Result>>();
  const [lastSuccessful, setLastSuccessful] = useState<TaskInstance<Result>>();

  const [currentFuture, setCurrent] = useState<Future>();

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
    currentFuture && currentFuture.deinit();
  }, [currentFuture]);

  useEffect(() => () => cancelAll(), [currentFuture]);

  const runTask = useCallback(
    (...args: Args): Future<Result | undefined> => {
      setPerformCount(performCount + 1);
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
    },
    deps
  );

  const perform = useCallback(
    (...args: Args) => {
      if (currentFuture) {
        const instance = { ...initialTaskInstance };
        setLast(instance);
        return instance;
      } else {
        setIsRunning(true);
        const future = runTask(...args).finally(() => {
          setIsRunning(false);
          setCurrent(undefined);
        });
        setCurrent(future);
        return createTaskInstance(future);
      }
    },
    [...deps, currentFuture]
  );

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

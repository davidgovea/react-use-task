import { fiber } from 'posterus/fiber';
import { DependencyList, useEffect, useState } from 'react';


interface TaskInstanceBase<T> {
  isSuccessful: boolean;
  isError: boolean;
  error?: Error;
  value?: T;
}
interface TaskInstanceError<T> extends TaskInstanceBase<T> {
  isSuccessful: false;
  isError: true;
  error: Error
  value: T;
}
interface TaskInstanceSuccess<T> extends TaskInstanceBase<T> {
  isSuccessful: true;
  isError: false;
  error: undefined
  value: undefined;
}
type TaskInstance<T> = (TaskInstanceBase<T> | TaskInstanceError<T> | TaskInstanceSuccess<T>) & {
  toPromise: () => Promise<T>;
};

interface TaskState<T> {
  isRunning: boolean;
  isIdle: boolean;
  performCount: number;
  last?: TaskInstance<T>;
  lastSuccessful?: TaskInstance<T>;
}

interface Task<T> extends TaskState<T> {
  perform: () => Promise<T>;
  cancelAll: () => void;
}

type TaskValues<T, A extends any[]> = [TaskState<T>, (...args: A) => TaskInstance<T>, () => void];

export function useTask<Result = any, Args extends any[] = any[]>(
  taskFn: IterableIterator<any>,
  deps: DependencyList = []
): TaskValues<Result, Args> {
  const [state, setState] = useState<TaskState<Result>>({
    isIdle: true,
    isRunning: false,
    performCount: 0,
  });

  useEffect(() => {
    const future = fiber((taskFn as any)());
    return () => {
      future.deinit();
    };
  }, deps);

  return [
    state,
    (...args: Args) => ({} as any),
    () => undefined,
  ];
}

export default useTask;

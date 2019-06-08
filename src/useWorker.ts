import { DependencyList, useEffect } from 'react';

import { TaskState, useTask } from './useTask';

type WorkerValues<T> = [TaskState<T>, () => void];

export function useWorker(
  workerFn: () => IterableIterator<any>,
  deps: DependencyList = []
): WorkerValues<void> {
  const [state, perform, cancelAll] = useTask(workerFn, deps);
  useEffect(() => {
    perform();
  }, []);
  return [state, cancelAll];
}

export default useWorker;

import { fiber } from 'posterus/fiber';
import { useEffect } from 'react';

function useTask(taskFn: IterableIterator<any>): void {
  useEffect(() => {
    const future = fiber((taskFn as any)());
    return () => {
      future.deinit();
    }
  });
}

export default useTask;

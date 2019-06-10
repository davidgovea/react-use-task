import test from 'ava';
import { renderHook } from 'react-hooks-testing-library';

import useWorker from './useWorker';

test('basic worker', async t => {
  const { result } = renderHook(() =>
    useWorker(function*(): IterableIterator<any> {
      yield 5;
    }, [])
  );

  const [initialState] = result.current;
  t.is(initialState.isRunning, true, 'it starts in a running state');
});

test('worker with no dependencies', async t => {
  const { result } = renderHook(() =>
    useWorker(function*(): IterableIterator<any> {
      while (true) {
        yield new Promise(r => setTimeout(r, 1000));
      }
    })
  );

  const [initialState] = result.current;
  t.is(initialState.isRunning, true, 'it starts in a running state');
});

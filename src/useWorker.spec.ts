import test from 'ava';
import { renderHook } from 'react-hooks-testing-library';

import useWorker from './useWorker';

test('test', async t => {
  const hook = renderHook(({ task }) => useWorker(task, []), {
    initialProps: {
      *task(): any {
        yield 5;
      },
    },
  });

  const [initialState] = hook.result.current;
  t.is(initialState.isRunning, true, 'it starts in a running state');
});

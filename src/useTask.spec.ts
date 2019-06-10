import test from 'ava';
import { Future } from 'posterus';
import { renderHook } from 'react-hooks-testing-library';

import useTask from './useTask';

test('test', async t => {
  const hook = renderHook(({ task }) => useTask(task, []), {
    initialProps: {
      *task(): any {
        yield 'foo';
      },
    },
  });

  const [initialState] = hook.result.current;
  t.is(initialState.isRunning, false, 'it starts in a non-running state');

});

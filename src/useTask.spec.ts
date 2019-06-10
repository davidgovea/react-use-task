import test from 'ava';
import inRange from 'in-range';
import { Future } from 'posterus';
import { renderHook } from 'react-hooks-testing-library';
import timeSpan from 'time-span';

import useTask from './useTask';

test('basic task state', async t => {
  const { result } = renderHook(() =>
    useTask(function*(): IterableIterator<any> {
      yield new Promise(r => setTimeout(r, 1000));
      return 'foo';
    }, [])
  );

  const [initialState, perform, cancelAll] = result.current;
  t.is(initialState.isRunning, false, 'it starts in a non-running state');
  t.is(initialState.isIdle, true, 'it starts in an idle state');
  t.is(initialState.performCount, 0, 'it starts with zero perform count');
  t.is(initialState.last, undefined, 'it starts no last task');
  t.is(
    initialState.lastSuccessful,
    undefined,
    'it starts with no lastSuccessful task'
  );

  const firstTask = perform();
  t.is(result.current[0].isRunning, true, 'now running');
  t.is(result.current[0].isIdle, false, 'now not idle');
  t.is(result.current[0].performCount, 1, 'one perform');
  t.deepEqual(
    result.current[0].last.cancel,
    firstTask.cancel,
    'last task in state'
  );
  t.is(
    result.current[0].lastSuccessful,
    undefined,
    'it starts with no lastSuccessful task'
  );

  await firstTask.toPromise();

  t.is(result.current[0].lastSuccessful.value, 'foo', 'return value was set');
  t.is(result.current[0].isRunning, false, 'finished running');
  t.is(result.current[0].isIdle, true, 'idle again');
  t.is(result.current[0].performCount, 1, 'still 1 perform count');
  t.deepEqual(
    result.current[0].last.cancel,
    firstTask.cancel,
    'last task still set'
  );
  t.deepEqual(
    result.current[0].lastSuccessful.cancel,
    firstTask.cancel,
    'successful task set'
  );
});

test.only('cancelling basic task', async t => {
  const { result } = renderHook(() =>
    useTask(function*(): IterableIterator<any> {
      yield new Promise(r => setTimeout(r, 1000));
      return 'foo';
    }, [])
  );

  const end = timeSpan();

  const [, perform, cancelAll] = result.current;
  const firstTask = perform();
  cancelAll();
  Future.scheduler.tick();
  t.is(result.current[0].isRunning, false, 'not running after cancel');
  t.is(result.current[0].performCount, 1, 'one perform');

  await firstTask.toPromise();
  t.true(inRange(end(), { start: 0, end: 50 }), 'Task was cancelled, not run');
  t.is(result.current[0].lastSuccessful, undefined, 'no successful task set');
});

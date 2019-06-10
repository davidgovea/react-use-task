# react-use-task

☎️ React hook for managing async tasks/coroutines (with cancellation)

[![NPM](https://img.shields.io/npm/v/react-use-task.svg)](https://www.npmjs.com/package/react-use-task)
[![Build Status](https://img.shields.io/circleci/project/github/davidgovea/react-use-task.svg)](https://circleci.com/gh/davidgovea/react-use-task)
[![](https://img.shields.io/codecov/c/github/davidgovea/react-use-task.svg)](https://codecov.io/gh/davidgovea/react-use-task)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/react-use-task.svg)](https://bundlephobia.com/result?p=react-use-task@latest)

## Why ?

True cancellation requires generator functions. This library was inspired by [ember-concurrency](https://github.com/machty/ember-concurrency) and uses [posterus](https://github.com/mitranim/posterus#fiber) to run generators as coroutines.

## Usage

### Tasks

```jsx
import { useTask } from 'react-use-task'

const Demo = () => {
  const [
    { isRunning, performCount, last, lastSuccessful },
    perform,
    cancelAll
  ] = useTask(function* () {
    yield new Promise(r => setTimeout(r, 1000));
    return +new Date;
  });

  return (
    <div>
      <button onClick={perform}>
        Perform Task
      </button>
      <button onClick={cancelAll}>
        Cancel All
      </button>
      <div>
        isRunning: {'' + isRunning}, Perform count: {performCount}
      </div>
      <div>
        last: {JSON.stringify(last)}
      </div>
      <div>
        last success value: {lastSuccessful ? lastSuccessful.value : '<none>'}
      </div>
    </div>
  )
}
```

### Workers (background tasks)

```jsx
import { useWorker } from 'react-use-task'

const Demo = () => {
  useWorker(function* () {
    while (true) {
      console.log('tick');
      yield new Promise(r => setTimeout(r, 1000));
    }
  });

  return (
    <div>
      <div>Worker task will be automatically cancelled when component is unmounted</div>
    </div>
  )
}
```

## Plans

- [x] Non-immediate running of task (e.g. on button press)
- [x] `.drop`, `.restartable`, `.maxConcurrency` task modifiers (like `ember-concurrency`)
- [x] Exposing manual cancellation
- [x] Historical state - `last`, `lastSuccessful` (like `e-c`)
- [ ] Code sandbox examples
- [ ] Finalize `TaskInstance` API - go all-in on futures?
- [ ] Improve error handling
- [ ] More docs / motivaion / examples
- [ ] Fancy visualizations (like [ember-concurrency](http://ember-concurrency.com/docs/task-concurrency))
- [ ] Possibly split out some Posterus.Future utilities

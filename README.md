# Deprecated: you probably don't want this.
Simply put: Components are not the right place to define these tasks. Currently working towards bringing `ember-concurrency`-like modifiers and derived state to `redux-saga`. This was a fun exercise.

# react-use-task

☎️ React hooks for writing async tasks/workers (with cancellation and concurrency)

[![NPM](https://img.shields.io/npm/v/react-use-task.svg)](https://www.npmjs.com/package/react-use-task)
[![Build Status](https://img.shields.io/circleci/project/github/davidgovea/react-use-task.svg)](https://circleci.com/gh/davidgovea/react-use-task)
[![](https://img.shields.io/codecov/c/github/davidgovea/react-use-task.svg)](https://codecov.io/gh/davidgovea/react-use-task)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/react-use-task.svg)](https://bundlephobia.com/result?p=react-use-task@latest)

## Why ?

This library was inspired by [ember-concurrency](https://github.com/machty/ember-concurrency) and uses [posterus](https://github.com/mitranim/posterus#fiber) to run generators as cancellable async-tasks.

[Redux-Saga](https://redux-saga.js.org/) is a fantastic tool for managing these types of tasks. I use it with [redux-saga-thunk](https://github.com/diegohaz/redux-saga-thunk) to get "derived state". It's *extremely* powerful. But, let's be honest - sagas are a lot of boilerplate. Sometimes, a less-powerful tool can be useful for implementing common patterns. 

This library is not intended to replace redux-saga. It is component-lifecycle centric, and hopes to provide some ergonomic tools for consise async tasks:

* **Derived state**: Never manage boolean flags. Declaratively handle loading, error, and success states.
* **Task Modes**: By default, tasks can be performed multiple-times in parallel. "Modes" can be selected to modify task behavior. Using a telephone analogy:
  * Restartable: "Hang up on current caller when a new call comes in"
  * Drop: "If already on the phone, ignore incoming calls"
  * Enqueue: "Place callers on hold and handle them in order"
  * Keep Latest: ?analogy? Like drop, but the last ignored gets handled when free
* **Concurrency**: Easily specify concurrency limits
* **Cancellation**: Cancel individual task instances, or all running instances at once. Component unmounted? Everything cleans up automatically.

## Install

    $ npm install --save react-use-task

## Usage

### Basic Tasks
#### Example use-case: Save button
```jsx
import { useTask } from 'react-use-task';

const BasicTask = () => {
  const [{ isRunning, last }, perform] = useTask(function*() {
    // Hit some remote api
    yield delay(1000);
  });

  return (
    <div>
      {/* When task isRunning, button disabled & inner text changed */}
      <button disabled={isRunning} onClick={perform}>
        {isRunning ? 'Saving...' : 'Perform Task'}
      </button>

      {last && last.isSuccessful && <div>Saved!</div>}
    </div>
  );
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

```
---
### One-at-max Tasks
#### Example use-case: ignore button-spam (drop mode) - TODO
#### Example use-case: typeahead seach (debounced via restartable) - TODO

---
### Workers (background tasks)
#### Example use-case: Stock ticker (polling remote API)
```jsx
import { useWorker } from "react-use-task";

const StockTicker = () => {
  const [price, setPrice] = useState();
  useWorker(function*() {
    // Infinite loop worker
    while (true) {
      yield delay(1000);
      setPrice(Math.random() * 50 + 50);
    }
  });

  if (typeof price === "undefined") {
    return <div>Loading...</div>;
  }
  return <div>Latest stock price: ${price.toFixed(2)}</div>;
};

// By mounting / unmounting the <StockTicker>, the worker loop is
//  automatically started & cancelled with the component
const App = () => {
  const [showTicker, setShow] = useState(false);
  return (
    <div>
      <button onClick={() => setShow(!showTicker)}>Toggle stock ticker</button>
      {showTicker && <StockTicker />}
    </div>
  );
};

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

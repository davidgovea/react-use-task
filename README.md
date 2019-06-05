# react-use-task

☎️ React hook for managing async tasks/coroutines (with cancellation)

## Why ?

True cancellation requires generator functions. This library was inspired by [ember-concurrency](https://github.com/machty/ember-concurrency) and uses [posterus](https://github.com/mitranim/posterus#fiber) to run generators as coroutines.

## Usage

```jsx
import useTask from 'react-use-task'

const Demo = () => {
  useTask(function* () {
    while (true) {
      console.log('tick');
      yield new Promise(r => setTimeout(r, 1000));
    }
  });

  return (
    <div>
      <div>Task will be automatically cancelled when component is unmounted</div>
    </div>
  )
}
```

## Plans

* Non-immediate running of task (e.g. on button press)
* `.drop`, `.restartable`, `.maxConcurrency` task modifiers (like `ember-concurrency`)
* Exposing manual cancellation
* Historical state - `last`, `lastSuccessful` (like `e-c`)

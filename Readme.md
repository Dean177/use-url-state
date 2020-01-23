# with-url-state

[![CircleCI](https://circleci.com/gh/Dean177/use-url-state.svg?style=shield)](https://circleci.com/gh/Dean177/use-url-state)
[![codecov](https://codecov.io/gh/Dean177/with-url-state/branch/master/graph/badge.svg)](https://codecov.io/gh/Dean177/with-url-state)
[![Npm](https://badge.fury.io/js/with-url-state.svg)](https://www.npmjs.com/package/with-url-state)

Lifts the state out of a react component and into the url

![color-example](./demo/color-example.gif)

## Installation

To install with npm:

```sh
npm install with-url-state --save
```

To install with yarn:

```sh
yarn add with-url-state
```

## Usage

Check out the the [demo](https://dean177.github.io/with-url-state/) or view the [code](https://github.com/Dean177/use-url-state/tree/master/demo)

The api is very similar to `useState` with some important differences:
- Url state **must** be an object, you can't use any primitive values likes strings, booleans, numbers or collections such as Map or Set.
- Url values in your state object must be strings as there is no way to tell the if `?someParam=false` should be deserialized to a boolean or to a string.
- The url is shared between your whole app. Multiple components using `useUrlState` will all affect the url simultaneously. This means that a `setUrlState` call will cause *all* components using `useUrlState` to re-render.
- State is **shallow merged** into the previous state e.g.
  ```
  newState = {
    ...previousState,
    ...stateUpdate,
  } 
  ``` 
  This allows components to adjust the url without having to worry about 'destroying' state that other components may be relying on. 
- The url is easily edited by your users, you should validate the values you receive 


### Example

```javascript
import React from 'react'
import { useUrlState } from 'with-url-state'

export const UrlForm = () => {
  const [urlState, setUrlState] = useUrlState({ color: 'blue' })
  return (
    <div className="UrlForm">
      <div className="current-state" style={{ backgroundColor: props.urlState.color }}>
        <div>{urlState.color}</div>
      </div>
      <div className="color-buttons">
        <button className="Red" onClick={() => setUrlState({ color: 'red' })}>
          Red
        </button>
        <button className="Green" onClick={() => setUrlState({ color: 'green' })}>
          Green
        </button>
        <button className="Blue" onClick={() => setUrlState({ color: 'blue' })}>
          Blue
        </button>
      </div>
    </div>
  )
}
```

## Recipes

### Higher-order component 

If your application relies on the removed higher-order component API you can re-implement it like so:

```javascript
import React from 'react'
import { useUrlState } from 'with-url-state'

let withUrlState = (getInitialState, options) => (WrappedComponent) => (props) => {
  let [urlState, setUrlState] = useUrlState(getInitialState(props), options)
  return <WrappedComponent {...props} urlState={urlState} setUrlState={setUrlState} />
}
```

### Render-prop 

If your application relies on the removed render prop API you can re-implement it like so:

```javascript
import React from 'react'
import { useUrlState } from 'with-url-state'

const UrlState = ({initialState, options, render }) => {
  let [urlState, setUrlState] = useUrlState(initialState, options)
  return render({urlState, setUrlState})
}
```

## Motivation

`with-url-state` automates tiresome query parameter manipulations, simplifying components where the URL will be used for sharing, search results, querying data or tracking a visible portion of a map.

The api provided is:

- based on [hooks](https://reactjs.org/docs/hooks.html)
- type-safe thanks to [Typescript](https://www.typescriptlang.org/)
- very similar to [Reacts built in state](https://reactjs.org/docs/state-and-lifecycle.html) apis, so converting a component which already manages state is usually as simple as replacing `useState` with `useUrlState`!

## Pollyfill

For use in IE11 you will need [https://github.com/kumarharsh/custom-event-polyfill](https://github.com/kumarharsh/custom-event-polyfill)
and add the following to the entry point of your application: 
```js
import 'custom-event-polyfill';
if (typeof Event !== 'function') { window.Event = CustomEvent; }  
``

# with-url-state

[![CircleCI](https://circleci.com/gh/Dean177/with-url-state.svg?style=shield)](https://circleci.com/gh/Dean177/with-url-state)
[![codecov](https://codecov.io/gh/Dean177/with-url-state/branch/master/graph/badge.svg)](https://codecov.io/gh/Dean177/with-url-state)
[![Npm](https://badge.fury.io/js/with-url-state.svg)](https://www.npmjs.com/package/with-url-state)

Lifts the state out of a react component and into the url

![color-example](./example/color-example.gif)

## Installation

To install with npm use

`npm install with-url-state --save`

To install with yarn use

`yarn add with-url-state`

## Usage

Check out the the [examples/](https://github.com/Dean177/with-url-state/tree/master/example) or play with it in [CodeSandbox](https://codesandbox.io/s/18x4l87yx7). 

Using javascript

```javascript
import React from 'react'
import { withUrlState } from 'with-url-state'

const enhance = withUrlState(props => ({ color: 'blue' }))

export const UrlForm = enhance(props => (
  <div className="UrlForm">
    <div className="current-state" style={{ backgroundColor: props.urlState.color }}>
      <div>{props.urlState.color}</div>
    </div>
    <div className="color-buttons">
      <button className="Red" onClick={() => props.setUrlState({ color: 'red' })}>
        Red
      </button>
      <button className="Green" onClick={() => props.setUrlState({ color: 'green' })}>
        Green
      </button>
      <button className="Blue" onClick={() => props.setUrlState({ color: 'blue' })}>
        Blue
      </button>
    </div>
  </div>
))
```

Using typescript

```typescript jsx
import React from 'react'
import { withUrlState, UrlStateProps } from 'with-url-state'

type OwnProps = {}
type UrlState = { color: string }

const enhance = withUrlState<OwnProps, UrlState>((prop: OwnProps) => ({ color: 'blue' }))

export const UrlForm = enhance((props: OwnProps & UrlStateProps<UrlState>) => (
  <div className="UrlForm">
    <div className="current-state" style={{ backgroundColor: props.urlState.color }}>
      <div>{props.urlState.color}</div>
    </div>
    <div className="color-buttons">
      <button className="Red" onClick={() => props.setUrlState({ color: 'red' })}>
        Red
      </button>
      <button className="Green" onClick={() => props.setUrlState({ color: 'green' })}>
        Green
      </button>
      <button className="Blue" onClick={() => props.setUrlState({ color: 'blue' })}>
        Blue
      </button>
    </div>
  </div>
))
```

Using the render-prop component

```typescript jsx
import React from 'react'
import { UrlState } from 'with-url-state'

type OwnProps = {}
type UrlState = { color: string }

export const UrlForm = (props: OwnProps) => (
  <UrlState
    initialState={{ color: 'green' }}
    render={({ setUrlState, urlState }) => (
      <div className="UrlForm">
        <div className="current-state" style={{ backgroundColor: urlState.color }}>
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
    )}
  />
)
```

## Motivation

`with-url-state` automates the query parameter manipulations, simplifying URL sharing for search results, querying data or tracking a visible portion of a map.

The api provided is:

- based on [higer-order-components](https://reactjs.org/docs/higher-order-components.html) which makes it composable and testable
- has a render-prop alternative for convenience
- type-safe thanks to [Typescript](https://www.typescriptlang.org/)
- very similar to [Reacts built in state](https://reactjs.org/docs/state-and-lifecycle.html) apis, so converting a component which already manages state is usually as simple as replacing `setState` with `setUrlState`!

# with-url-state

[![CircleCI](https://circleci.com/gh/Dean177/with-url-state.svg?style=shield)](https://circleci.com/gh/Dean177/with-url-state)
[![codecov](https://codecov.io/gh/Dean177/with-url-state/branch/master/graph/badge.svg)](https://codecov.io/gh/Dean177/with-url-state)
[![Greenkeeper badge](https://badges.greenkeeper.io/Dean177/with-url-state.svg)](https://greenkeeper.io/)
[![Npm](https://badge.fury.io/js/with-url-state.svg)](https://www.npmjs.com/package/with-url-state)

Lifts the state out of a react component and into the url

![color-example](./example/color-example.gif)

This package allows applications to retrieve the state from a react component and appends it to the url.

## Installation

To install with npm use

`npm install with-url-state --save`

To install with yarn use

`yarn add with-url-state`

## Usage

Play with it in [CodeSandbox](https://codesandbox.io/s/nk04py9v6p)

Using javascript

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

Using the higher-order-component api

```javascript
import React from 'react'
import { withUrlState } from 'with-url-state'

const enhance = withUrlState(() => ({ color: 'blue' }))

export const UrlForm = enhance((props) => (
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

export const UrlForm = () => (
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

`with-url-state` automates tiresome query parameter manipulations, simplifying components where the URL will be used for sharing, search results, querying data or tracking a visible portion of a map.

# with-url-state

Lifts state out of a react component and into the url
 
## Installation

`yarn add with-url-state`

## Usage

Check out the [demo](https://dean177.github.io/with-url-state/) and the [example/](https://github.com/Dean177/with-url-state/tree/master/example) directory

Using javascript

```javascript
import { createBrowserHistory } from 'history';
import React from 'react';
import { withUrlState } from 'with-url-state';

const history = createBrowserHistory();

export const UrlForm = (props: OwnProps & UrlStateProps<LiftedState>) => (
  <div className="UrlForm">
    <div className="current-state" style={{ backgroundColor: props.urlState.color}}>
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
);

export default withUrlState<OwnProps, LiftedState>(history, () => ({ color: 'blue' }))(UrlForm);
```

Using typescript

```typescript
import { createBrowserHistory } from 'history';
import * as React from 'react';
import { withUrlState, UrlStateProps } from 'with-url-state';

const history = createBrowserHistory();

type OwnProps = {};
type LiftedState = { color: string };

export const UrlForm = (props: OwnProps & UrlStateProps<LiftedState>) => (
  <div className="UrlForm">
    <div className="current-state" style={{ backgroundColor: props.urlState.color}}>
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
);

export default withUrlState<OwnProps, LiftedState>(history, { color: 'blue' })(UrlForm);

```
# with-url-state

Lifts state out of a react component and into the url
 
## Installation

`yarn add with-url-state`

## Usage

```javascript
import React from 'react';
import { withUrlState } from 'with-url-state';

export const UrlForm = ({ setUrlState, urlState }) =>
  <div>
   <div className="currentState">{urlState.color}</div>
   <button className="Green" onClick={() => setUrlState({ color: 'Green' })}>
     Green
   </button>
   <button className="Red" onClick={() => setUrlState({ color: 'Red' })}>
     Red
   </button>
  </div>;

export default withUrlState(UrlForm)
```

```typescript
import * as React from 'react';
import { withUrlState, UrlStateProps } from 'with-url-state';

type LiftedState = { color: string };

export const UrlForm = (props: UrlStateProps<LiftedState>) =>
  <div>
    <div className="currentState">{props.urlState.color}</div>
    <button className="Green" onClick={() => props.setUrlState({ color: 'Green' })}>
      Green
    </button>
    <button className="Red"onClick={() => props.setUrlState({ color: 'Red' })}>
      Red
    </button>
  </div>;

export default withUrlState(UrlForm)
```
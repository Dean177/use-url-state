## 3.0.0

### Breaking changes

- This version new requires a minimum React version of 16.8.0
- The `withUrlState` higher-order component and the `Async` render-props component have been removed. They can easily be recreated from the hook, see the new 'recipes' section in [Readme.md](Readme.md) 
- The typescript typings now enforce that you treat the state you receive as a single level object where all the values are stings (see `FlatStringy<T>` in [useUrlState.ts](./src/useUrlState.ts))

### New features

- A hook (`useUrlState`) is now provided that works almost the same way as the built in `useState` hook.

## 2.0.0

### Breaking changes

The html5 history api is now used by default. This means that you no longer need to provide a `history` object has the first parameter.
In practice usually means you will need to drop the first parameter to `withUrlState`, and usage will remain the same.

#### Before

```js
const enhance = withUrlState(history, () => ({ color: 'blue' }))
```

#### After

```js
const enhance = withUrlState(() => ({ color: 'blue' }))
```

### New features

A new render-prop based API is also available:

Now you can do:

```js jsx
import { UrlState } from 'with-url-state'

const RenderProp = (props: OwnProps) => (
  <UrlState
    initialState={{ color: 'purple' }}
    render={({ urlState, setUrlState }: UrlStateProps<LiftedState>) => (
      <div>
        <div>{urlState.color}</div>
        <button onClick={() => setUrlState({ color: 'green' })}>Green</button>
        <button onClick={() => props.setUrlState({ color: 'purple' })}>Purple</button>
      </div>
    )}
  />
)
```

`withUrlState` now takes a config object as its second parameter which allows you to:

- Provide a custom `history` object in environments which don't support the html5 api.
- Control weather a change of state should result in a `push` or `replace` event for users navigation control.

- Have more fine grained control over serialisation, such as:

  - Defaults which don't appear in the url
  - Alias the parameters passed to your component
  - Complex nested objects

  See the `'supports complex serialisation workflows'` test for more.

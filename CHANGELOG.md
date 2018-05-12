## 2.0.0

### Breaking changes
 
-The html5 history api is now used by default. This means that you no longer need to provide a `history` object has the first parameter.
In practice usually means you will need to drop the first parameter to `withUrlState`, and usage will remain the same.

#### Before

```typescript jsx
const enhance = withUrlState(history, () => ({ color: "blue" }))
```


#### After

```typescript jsx
const enhance = withUrlState(() => ({ color: "blue" }))
```


### New features

`withUrlState` now takes a config object as its second parameter which allows you to:

- Provide a custom `history` object in environments which don't support the html5 api.
- Have more fine grained control over serialisation, such as:
 - Defaults which don't appear in the url
 - Alias the parameters passed to your component
 - Complex nested objects
 See the `'supports complex serialisation workflows'` test for more.
- Control weather a change of state should result in a `push` or `replace` event for users navigation control.

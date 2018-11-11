import { createBrowserHistory } from 'history'
import * as React from 'react'
import { Router, Link } from '@reach/router'
import { withUrlState, UrlStateProps, UrlState } from 'with-url-state'
import './App.css'

type OwnProps = { default?: boolean; path: string }
type LiftedState = { color: string }

export const UrlForm = (props: OwnProps & UrlStateProps<LiftedState>) => (
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
      <button className="Purple" onClick={() => props.setUrlState({ color: 'purple' })}>
        Purple
      </button>
    </div>
  </div>
)

const Html = withUrlState<LiftedState, OwnProps>(() => ({ color: 'blue' }))(UrlForm)

const CustomSerialisation = withUrlState<LiftedState, OwnProps>(
  () => ({ color: 'green' }),
  {
    serialisation: {
      parse: (search: string) => ({
        color:
          search === '?c=blue'
            ? 'blue'
            : search === '?c=green'
              ? 'green'
              : search === '?c=red'
                ? 'red'
                : 'blue',
      }),
      stringify: ({ color }: Partial<LiftedState>) =>
        color === 'blue' ? '?c=blue' : color === 'green' ? '?c=green' : '?c=red',
    },
  },
)(UrlForm)

const RenderProp = (props: OwnProps) => (
  <UrlState
    initialState={{ color: 'purple' }}
    render={({ urlState, setUrlState }: UrlStateProps<LiftedState>) => (
      <UrlForm {...props} setUrlState={setUrlState} urlState={urlState} />
    )}
  />
)
export default () => (
  <div className="App">
    <div className="side-nav">
      <Link to="/html5">Html5 History</Link>
      <Link to="/custom-serialisation">Custom serialisation</Link>
      <Link to="/render-prop">Render prop</Link>
    </div>
    <div className="content">
      <Router>
        <Html default={true} path="/" />
        <CustomSerialisation path="/custom-serialisation" />
        <RenderProp path="/render-prop" />
      </Router>
    </div>
  </div>
)

import { createBrowserHistory } from 'history'
import * as React from 'react'
import { Redirect } from 'react-router'
import { Router, Link, Route, Switch } from 'react-router-dom'
import { html5HistoryAdapter, withUrlState, UrlStateProps } from 'with-url-state'
import './App.css'

const history = createBrowserHistory()

type OwnProps = {}
type LiftedState = { color: string }

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
)

const Html = withUrlState<OwnProps, LiftedState>(() => ({ color: 'blue' }), { history: html5HistoryAdapter })(UrlForm)

const Npm = withUrlState<OwnProps, LiftedState>(() => ({ color: 'red' }), { history })(UrlForm)

const CustomSerialisation = withUrlState<OwnProps, LiftedState>(
  () => ({ color: 'green' }),
  {
    history: html5HistoryAdapter,
    serialisation: {
      parse: (search: string) => {
        console.warn(search)
        return ({
          color: search === '?c=blue' ? 'blue' :
            search === '?c=green' ? 'green' :
              search === '?c=red' ? 'red' : undefined
        })
      },
      stringify: ({ color }: LiftedState) =>
        color === 'blue' ? 'c=blue' :
          color === 'green' ? 'c=green' : 'c=red',
    }
  }
)(UrlForm)

export default () => (
  <Router history={history}>
    <div className="App">
      <div className="side-nav">
        <Link to="/html5">Html5 History</Link>
        <Link to="/npm">Npm History</Link>
        <Link to="/custom-serialisation">Custom serialisation</Link>
      </div>
      <div className="content">
        <Switch>
          <Route path="/html5" component={Html} />
          <Route path="/npm" component={Npm} />
          <Route path="/custom-serialisation" component={CustomSerialisation} />
          <Redirect to="/html5" />
        </Switch>
      </div>
    </div>
  </Router>
)
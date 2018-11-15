import * as React from 'react'
import { withUrlState, UrlStateProps, UrlState } from 'with-url-state'
import './App.css'

type OwnProps = {}
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

const EnhancedUrlForm = withUrlState<LiftedState, OwnProps>(() => ({ color: 'blue' }))(
  UrlForm,
)

export default () => (
  <div className="App">
    <div className="content">
      <EnhancedUrlForm />
    </div>
  </div>
)

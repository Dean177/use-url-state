import { createBrowserHistory } from 'history';
import * as React from 'react';
import { withUrlState, UrlStateProps } from 'with-url-state';
import './App.css';

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

export default withUrlState<OwnProps, LiftedState>(history, () => ({ color: 'blue' }))(UrlForm);

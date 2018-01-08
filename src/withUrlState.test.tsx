import { mount } from 'enzyme'
import * as React from 'react'
import { createBrowserHistory, History } from 'history'
import * as queryString from 'query-string'
import { withUrlState, UrlStateProps } from './withUrlState'

type ControlState = { color: string }
declare const global: { window: any }

describe('withUrlState', () => {
  let testHistory: History = null as any
  let UrlBasedControls: any
  let UrlConnectedControls: any

  beforeEach(() => {
    testHistory = createBrowserHistory()
    UrlBasedControls = (props: UrlStateProps<ControlState>) =>
      <div>
        <div className="currentState">{props.urlState.color}</div>
        <button className="Green" onClick={() => props.setUrlState({ color: 'Green' })}>
          Green
        </button>
        <button className="Red"onClick={() => props.setUrlState({ color: 'Red' })}>
          Red
        </button>
      </div>

    UrlConnectedControls =
      withUrlState<{}, ControlState>(testHistory, () => ({ color: 'Red' }))(UrlBasedControls)
  })

  it('sets the url with the initial state', () => {
    mount(<UrlConnectedControls />)
    expect(queryString.parse(testHistory.location.search)).toEqual({ color: 'Red' })
    expect(queryString.parse(global.window.location.search)).toEqual({ color: 'Red' })
  })

  it('provides the current urls state to the wrapped component', () => {
    const wrapper = mount(<UrlConnectedControls />)
    expect(wrapper.find('.currentState').text()).toBe('Red')
  })

  it('updates the url when the wrapped component updates the state', () => {
    const wrapper = mount(<UrlConnectedControls />)
    expect(queryString.parse(testHistory.location.search)).toEqual({ color: 'Red' })

    wrapper.find('.Green').simulate('click')
    expect(queryString.parse(testHistory.location.search)).toEqual({ color: 'Green' })
  })
})

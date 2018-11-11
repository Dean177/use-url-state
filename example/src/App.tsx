import React from 'react'
import { useUrlState } from 'with-url-state'
import './App.css'

export const App = () => {
  const [urlState, setUrlState] = useUrlState({ color: 'yellow' })
  return (
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
        <button className="Purple" onClick={() => setUrlState({ color: 'purple' })}>
          Purple
        </button>
      </div>
    </div>
  )
}

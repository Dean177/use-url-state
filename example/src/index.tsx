import React from 'react'
import { render } from 'react-dom'
import { App } from './App'
import * as serviceWorker from './registerServiceWorker'

render(<App />, document.getElementById('root') as HTMLElement)

serviceWorker.unregister()

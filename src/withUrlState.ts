import {
  Hash,
  LocationDescriptorObject,
  Pathname,
  Search,
  UnregisterCallback,
} from 'history'
import qs from 'qs'
import { Component, ComponentType, createElement, ReactChild, ReactElement } from 'react'

type PropMapper<Props, MappedProps> = (
  component: ComponentType<MappedProps>,
) => ComponentType<Props>

export type UrlStateProps<T> = {
  setUrlState: (newState: T) => void
  urlState: T
}

export type HistoryAdapter = {
  location: {
    pathname: Pathname
    search: Search
    hash: Hash
  }
  listen: (listener: () => void) => UnregisterCallback
  push: (location: LocationDescriptorObject) => void
  replace: (location: LocationDescriptorObject) => void
}

declare var window: Window & {
  Event: typeof Event
}

export const html5HistoryAdapter: HistoryAdapter = {
  listen: (listener): UnregisterCallback => {
    window.addEventListener('popstate', listener)
    return () => window.removeEventListener('popstate', listener)
  },
  location: window.location,
  push: ({ search }: LocationDescriptorObject) => {
    window.history.pushState(window.history.state, document.title, search)
    window.dispatchEvent(new window.Event('popstate'))
  },
  replace: ({ search }: LocationDescriptorObject) => {
    window.history.replaceState(window.history.state, document.title, search)
    window.dispatchEvent(new window.Event('popstate'))
  },
}

export type Parse<T> = (queryString: string) => T

export type Stringify<T> = (state: T) => string

export type Config<T> = {
  history: HistoryAdapter
  serialisation: {
    parse: Parse<T>
    stringify: Stringify<T>
  }
  shouldPushState: (next: T, current: T) => boolean
}

const alwaysReplace = () => false

const parseConfig = <T>(config: Partial<Config<T>> = {}): Config<T> => ({
  history: config.history ? config.history : html5HistoryAdapter,
  serialisation: {
    parse:
      config.serialisation && config.serialisation.parse
        ? config.serialisation.parse
        : (queryString: string): T => qs.parse(queryString, { ignoreQueryPrefix: true }),
    stringify:
      config.serialisation && config.serialisation.stringify
        ? config.serialisation.stringify
        : (state: T) => qs.stringify(state, { addQueryPrefix: true }),
  },
  shouldPushState: config.shouldPushState || alwaysReplace,
})

export type Props<T> = {
  config?: Partial<Config<T>>
  initialState: T
  render: (renderProps: UrlStateProps<T>) => ReactElement<any>
}

export class UrlState<T> extends Component<Props<T>, T> {
  history: HistoryAdapter
  state: T
  unsubscribe: () => void

  constructor(props: Props<T>) {
    super(props)
    const { history, serialisation } = parseConfig(this.props.config)
    this.history = history
    this.unsubscribe = this.history.listen(this.onLocationChange)

    // tslint:disable:no-any Typescript cant handle generic spread yet
    const state = {
      ...(props.initialState as any),
      ...(serialisation.parse(history.location.search) as any),
    } as T
    // tslint:enable:no-any

    this.state = state
  }

  componentDidMount(): void {
    const { serialisation } = parseConfig(this.props.config)
    this.history.replace({
      ...this.history.location,
      search: serialisation.stringify(this.state),
    })
  }

  componentDidUpdate(): void {
    const { history, serialisation } = parseConfig(this.props.config)

    if (this.history !== history) {
      this.unsubscribe()
      this.unsubscribe = history.listen(this.onLocationChange)
      const state = {
        ...(this.props.initialState as any), // tslint:disable-line:no-any
        ...(serialisation.parse(history.location.search) as any), // tslint:disable-line:no-any max-line-length Typescript cant handle generic spread yet,
      } as T
      history.replace({
        ...history.location,
        search: serialisation.stringify(state),
      })
    }
  }

  componentWillUnmount() {
    if (this.unsubscribe != null) {
      this.unsubscribe()
    }
  }

  onLocationChange = () => {
    const { serialisation } = parseConfig(this.props.config)
    this.setState(serialisation.parse(this.history.location.search))
  }

  setUrlState = (newState: T): void => {
    const { serialisation } = parseConfig(this.props.config)
    const nextLocation = {
      ...this.history.location,
      search: serialisation.stringify(newState),
    }

    this.props.config &&
    this.props.config.shouldPushState &&
    this.props.config.shouldPushState(newState, this.state)
      ? this.history.push(nextLocation)
      : this.history.replace(nextLocation)
  }

  render() {
    return this.props.render({
      setUrlState: this.setUrlState,
      urlState: this.state,
    })
  }
}

export type HigherOrderConfig<T, OP> = {
  history: HistoryAdapter
  serialisation: {
    parse: Parse<T>
    stringify: Stringify<T>
  }
  shouldPushState: (props: OP) => Config<T>['shouldPushState']
}

export const withUrlState = <T extends object, OP>(
  getInitialState: (props: OP) => T,
  config?: Partial<HigherOrderConfig<T, OP>>,
): PropMapper<OP, OP & UrlStateProps<T>> => (
  WrappedComponent: ComponentType<OP & UrlStateProps<T>>,
): ComponentType<OP> => (props: OP) =>
  createElement<Props<T>>(UrlState, {
    initialState: getInitialState(props),
    config: {
      ...config,
      shouldPushState: config && config.shouldPushState && config.shouldPushState(props),
    },
    render: ({ urlState, setUrlState }) =>
      createElement(WrappedComponent, {
        ...(props as any), // tslint:disable-line:no-any Typescript cant handle generic spread yet,
        urlState,
        setUrlState,
      }),
  })

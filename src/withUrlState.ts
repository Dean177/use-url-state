import {
  Hash,
  LocationDescriptorObject,
  LocationListener,
  Pathname,
  Search,
  UnregisterCallback,
} from 'history'
import * as qs from 'qs'
import { Component, ComponentType, createElement, ReactChild } from 'react'

type PropMapper<Props, MappedProps> = (
  component: ComponentType<MappedProps>,
) => ComponentType<Props>

export type UrlStateProps<T> = {
  setUrlState: (newState: Partial<T>) => void
  urlState: T
}

export type InternalState = {
  previousSearch: string
}

export type HistoryAdapter = {
  location: {
    pathname: Pathname
    search: Search
    hash: Hash
  }
  listen: (listener: LocationListener) => UnregisterCallback
  push: (location: LocationDescriptorObject) => void
  replace: (location: LocationDescriptorObject) => void
}

export const html5HistoryAdapter: HistoryAdapter = {
  listen: (listener: LocationListener): UnregisterCallback => {
    window.addEventListener('popstate', listener as () => void)
    return () => window.removeEventListener('popstate', listener as () => void)
  },
  location: window.location,
  push: ({ search }: LocationDescriptorObject) =>
    window.history.pushState(window.history.state, document.title, search),
  replace: ({ search }: LocationDescriptorObject) =>
    window.history.replaceState(window.history.state, document.title, search),
}

export type Parse<T> = (queryString: string) => Partial<T>

export type Stringify<T> = (state: Partial<T>) => string

export type Config<T = {}, OP = {}> = {
  history?: HistoryAdapter
  serialisation?: {
    parse: Parse<T>
    stringify: Stringify<T>
  }
  shouldPushState?: (props: OP, next: Partial<T>, current: Partial<T>) => boolean
}

const parseConfig = <T, OP = {}>(config: Config<T, OP> = {}) => ({
  history: config.history ? config.history : html5HistoryAdapter,
  parse:
    config.serialisation && config.serialisation.parse
      ? config.serialisation.parse
      : (queryString: string) => qs.parse(queryString, { ignoreQueryPrefix: true }),
  stringify:
    config.serialisation && config.serialisation.stringify
      ? config.serialisation.stringify
      : (state: Partial<T>) => qs.stringify(state, { addQueryPrefix: true }),
})

export const withUrlState = <T extends object, OP = {}>(
  getInitialState?: (props: OP) => T,
  config?: Config<T, OP>,
): PropMapper<OP, OP & UrlStateProps<T>> => {
  const { history, parse, stringify } = parseConfig(config)
  return (WrappedComponent: ComponentType<OP & UrlStateProps<T>>): ComponentType<OP> =>
    class WithUrlStateWrapper extends Component<OP, InternalState> {
      unsubscribe: (() => void) | null = null
      state = {
        previousSearch: history.location.search,
      }

      componentWillMount() {
        const initialState: Partial<T> | undefined =
          getInitialState && getInitialState(this.props)
        const search = stringify({
          ...(initialState as any), // tslint:disable-line:no-any
          ...(parse(history.location.search) as any), // tslint:disable-line:no-any max-line-length Typescript cant handle generic spread yet,
        } as Partial<T>)

        history.replace({
          ...history.location,
          search,
        })
        this.unsubscribe = history.listen(this.onLocationChange)
      }

      componentWillUnmount() {
        if (this.unsubscribe != null) {
          this.unsubscribe()
        }
      }

      onLocationChange = () => {
        if (history.location.search !== this.state.previousSearch) {
          this.setState({ previousSearch: history.location.search })
        }
      }

      setUrlState = (newState: Partial<T>): void => {
        const search = stringify({
          ...(getInitialState && (getInitialState(this.props) as any)), // tslint:disable-line:no-any Typescript cant handle generic spread yet
          ...(parse(history.location.search) as any), // tslint:disable-line:no-any max-line-length Typescript cant handle generic spread yet,
          ...(newState as any), // tslint:disable-line:no-any
        } as Partial<T>)

        const nextLocation = {
          ...history.location,
          search,
        }

        config &&
        config.shouldPushState &&
        config.shouldPushState(
          this.props,
          parse(search),
          parse(this.state.previousSearch),
        )
          ? history.push(nextLocation)
          : history.replace(nextLocation)

        this.onLocationChange()
      }

      render() {
        const enhancedProps: OP & UrlStateProps<T> = {
          ...(this.props as any), // tslint:disable-line:no-any Typescript cant handle generic spread yet
          setUrlState: this.setUrlState,
          urlState: parse(history.location.search),
        }

        return createElement<OP & UrlStateProps<T>>(WrappedComponent, enhancedProps)
      }
    }
}

export type Props<T> = {
  config?: Config<T> & {
    shouldPushState?: (next: Partial<T>, current: Partial<T>) => boolean
  }
  initialState?: T
  render: (renderProps: UrlStateProps<T>) => ReactChild
}

export class UrlState<T> extends Component<Props<T>, InternalState> {
  history: HistoryAdapter
  state: InternalState
  unsubscribe: () => void

  constructor(props: Props<T>) {
    super(props)
    const initialState: T | undefined = props.initialState
    const { history, parse, stringify } = parseConfig(this.props.config)
    this.history = history
    const state = {
      ...(initialState as any), // tslint:disable-line:no-any
      ...(parse(history.location.search) as any), // tslint:disable-line:no-any max-line-length Typescript cant handle generic spread yet,
    } as Partial<T>
    const search = stringify(state)

    this.state = {
      previousSearch: history.location.search,
    }
    history.replace({
      ...history.location,
      search,
    })

    this.unsubscribe = history.listen(this.onLocationChange)
  }

  componentWillUnmount() {
    if (this.unsubscribe != null) {
      this.unsubscribe()
    }
  }

  onLocationChange = () => {
    const { history } = parseConfig(this.props.config)
    if (history.location.search !== this.state.previousSearch) {
      this.setState({ previousSearch: history.location.search })
    }
  }

  setUrlState = (newState: Partial<T>): void => {
    const { history, parse, stringify } = parseConfig(this.props.config)
    const nextLocation = {
      ...history.location,
      search: stringify(newState),
    }

    this.props.config &&
    this.props.config.shouldPushState &&
    this.props.config.shouldPushState(newState, parse(this.state.previousSearch))
      ? history.push(nextLocation)
      : history.replace(nextLocation)

    this.onLocationChange()
  }

  render() {
    const { history, parse } = parseConfig(this.props.config)
    return this.props.render({
      setUrlState: this.setUrlState,
      urlState: parse(history.location.search),
    })
  }
}

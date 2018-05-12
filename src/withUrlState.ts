import {
  Hash,
  LocationDescriptorObject,
  LocationListener,
  Pathname,
  Search,
  UnregisterCallback,
} from 'history'
import * as qs from 'qs'
import { Component, ComponentClass, ComponentType, createElement } from 'react'

type Decorator<Props, EnhancedProps> = (component: ComponentType<EnhancedProps>) => ComponentType<Props>

export type FlatStringyObject<T> = { [Key in keyof T]: string }

export type UrlStateProps<T> = {
  setUrlState: (newState: Partial<T>) => void,
  urlState: T,
}

export type InternalState<T> = {
  previousSearch: string,
}

export type HistoryAdapter = {
  location: {
    pathname: Pathname,
    search: Search,
    hash: Hash,
  },
  listen: (listener: LocationListener) => UnregisterCallback,
  push: (location: LocationDescriptorObject) => void,
  replace: (location: LocationDescriptorObject) => void,
}

export const html5HistoryAdapter: HistoryAdapter = {
  listen: (listener: LocationListener): UnregisterCallback => {
    window.addEventListener('popstate', listener as () => void)
    return () =>
      window.removeEventListener('popstate', listener as () => void)
  },
  location: window.location,
  push: ({ search }: LocationDescriptorObject) =>
    window.history.pushState(window.history.state, document.title, search),
  replace: ({ search }: LocationDescriptorObject) =>
    window.history.replaceState(window.history.state, document.title, search),
}

export type Parse<T> = (queryString: string) => Partial<T>

export type Stringify<T> = (state: Partial<T>) => string

export type Config<OP, T> = {
  history?: HistoryAdapter,
  serialisation?: {
    parse: Parse<T>,
    stringify: Stringify<T>,
  },
  shouldPushState?: (props: OP, next: Partial<T>, current: Partial<T>) => boolean
}

export const withUrlState =
  <OP, T extends object>(
    getInitialState?: (props: OP) => T,
    config?: Config<OP, T>,
  ): Decorator<OP, OP & UrlStateProps<T>> => {
    const history = config && config.history
      ? config.history
      : html5HistoryAdapter

    const parse: Parse<T> = config && config.serialisation && config.serialisation.parse
      ? config.serialisation.parse
      : (queryString: string) => qs.parse(queryString, { ignoreQueryPrefix: true })

    const stringify: Stringify<T> = config && config.serialisation && config.serialisation.stringify
      ? config.serialisation.stringify
      : (state: Partial<T>) => qs.stringify(state, { addQueryPrefix: false })

    return (WrappedComponent: ComponentType<OP & UrlStateProps<T>>): ComponentClass<OP> =>
      class WithUrlStateWrapper extends Component<OP, InternalState<T>> {
        unsubscribe: (() => void) | null = null
        state = {
          previousSearch: history.location.search,
        }

        componentWillMount() {
          const initialState: Partial<T> | undefined = getInitialState && getInitialState(this.props)
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
            // TODO why the force update?
            this.forceUpdate()
            this.setState({ previousSearch: history.location.search })
          }
        }

        setUrlState = (newState: Partial<T>): void => {
          const search = stringify({
            ...(parse(history.location.search) as any), // tslint:disable-line:no-any max-line-length Typescript cant handle generic spread yet,
            ...(newState as any), // tslint:disable-line:no-any
          } as Partial<T>)

          const nextLocation = {
            ...history.location,
            search,
          }

          config &&
          config.shouldPushState &&
          config.shouldPushState(this.props, parse(search), parse(this.state.previousSearch))
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

          return createElement(WrappedComponent, enhancedProps)
        }
      }
  }

import {
  Hash,
  LocationDescriptorObject,
  LocationListener,
  Pathname,
  Search,
  UnregisterCallback,
} from 'history'
import * as queryString from 'query-string'
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
  replace: (location: LocationDescriptorObject) => void;
}

export const html5HistoryAdapter: HistoryAdapter = {
  listen: (listener: LocationListener): UnregisterCallback => {
    window.addEventListener('popstate', listener as () => void)
    return () =>
      window.removeEventListener('popstate', listener as () => void)
  },
  location: window.location,
  replace: ({ search }: LocationDescriptorObject) =>
    history.replaceState(history.state, document.title, '?' + search),
}

export type Parse<T> = (queryString: string) => Partial<T>

export type Stringify<T> = (state: Partial<T>) => string

export type Config<T> = {
  history?: HistoryAdapter,
  serialisation?: {
    parse: Parse<T>,
    stringify: Stringify<T>,
  },
}

export const withUrlState =
  <OP, T extends object>(
    getInitialState?: (props: OP) => T,
    config?: Config<T>,
  ): Decorator<OP, OP & UrlStateProps<T>> => {
    const history = config && config.history
      ? config.history
      : html5HistoryAdapter

    const parse: Parse<T> = config && config.serialisation && config.serialisation.parse
      ? config.serialisation.parse
      : queryString.parse

    const stringify: Stringify<T> = config && config.serialisation && config.serialisation.stringify
      ? config.serialisation.stringify
      : queryString.stringify

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

          history.replace({
            ...history.location,
            search,
          })

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

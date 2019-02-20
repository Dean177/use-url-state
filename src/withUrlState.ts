import {
  Hash,
  LocationDescriptorObject,
  Pathname,
  Search,
  UnregisterCallback,
} from 'history'
import qs from 'qs'
import { useState, useEffect, ComponentType, createElement, ReactChild } from 'react'

declare var window: Window & {
  Event: typeof Event
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

export const html5HistoryAdapter: HistoryAdapter = {
  listen: (listener: () => void): UnregisterCallback => {
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

const alwaysReplaceState: Config<any>['shouldPushState'] = () => false

const parseConfig = <T extends {}>(config: Partial<Config<T>> = {}): Config<T> => ({
  history: config.history || html5HistoryAdapter,
  serialisation: config.serialisation || {
    parse: (queryString: string) => qs.parse(queryString, { ignoreQueryPrefix: true }),
    stringify: (state: Partial<T>) => qs.stringify(state, { addQueryPrefix: true }),
  },
  shouldPushState: config.shouldPushState || alwaysReplaceState,
})

export function useUrlState<T>(
  initialState: T,
  config?: Partial<Config<T>>,
): [T, (newState: T) => void] {
  const { history, serialisation, shouldPushState } = parseConfig(config)

  // tslint:disable:no-any Typescript cant handle generic spread yet
  const [currentState, setSearch] = useState({
    ...(initialState as any),
    ...(serialisation.parse(history.location.search) as any),
  } as T)
  // tslint:enable:no-any

  useEffect(() => {
    history.replace({
      ...history.location,
      search: serialisation.stringify(currentState),
    })
    return history.listen(function onLocationChange() {
      setSearch(serialisation.parse(history.location.search))
    })
  }, [history])

  function setUrlState(newState: T): void {
    const nextLocation = {
      ...history.location,
      search: serialisation.stringify(newState),
    }

    shouldPushState(newState, currentState)
      ? history.push(nextLocation)
      : history.replace(nextLocation)
  }

  return [currentState, setUrlState]
}

export type UrlStateProps<T> = {
  setUrlState: (newState: T) => void
  urlState: T
}

export type Props<T> = {
  config?: Partial<Config<T>>
  initialState: T
  render: (renderProps: UrlStateProps<T>) => ReactChild
}

export const UrlState = <T>(props: Props<T>) => {
  const [urlState, setUrlState] = useUrlState<T>(props.initialState, props.config)
  return props.render({ setUrlState, urlState })
}

export type PropEnhancer<Props, MappedProps> = (
  component: ComponentType<MappedProps>,
) => ComponentType<Props>

export type HocConfig<T, OP> = {
  history: HistoryAdapter
  serialisation: {
    parse: (queryString: string) => T
    stringify: (state: T) => string
  }
  shouldPushState: (props: OP) => (next: T, current: T) => boolean
}

export const withUrlState = <T extends {}, OP = {}>(
  getInitialState: (props: OP) => T,
  config: Partial<HocConfig<T, OP>> = {},
): PropEnhancer<OP, OP & UrlStateProps<T>> => (
  WrappedComponent: ComponentType<OP & UrlStateProps<T>>,
): ComponentType<OP> => (props: OP) => {
  const hocConfig: Partial<Config<T>> = {
    ...config,
    shouldPushState: config.shouldPushState && config.shouldPushState(props),
  }
  const [urlState, setUrlState] = useUrlState(getInitialState(props), hocConfig)
  return createElement(WrappedComponent, ({
    ...(props as any),
    urlState,
    setUrlState,
  } as any) as OP & UrlStateProps<T>)
}

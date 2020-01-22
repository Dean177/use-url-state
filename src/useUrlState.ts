import qs from 'qs'
import {
  ComponentType,
  createElement,
  ReactElement,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from 'react'

export type HistoryAction = 'push' | 'replace'

export type Pathname = string

export type Search = string

export type Location = {
  pathname: Pathname
  search: Search
}

export type UnregisterCallback = () => void

export type HistoryAdapter = {
  listen: (listener: () => void) => UnregisterCallback
  location: Location
  push: (location: Location) => void
  replace: (location: Location) => void
}

const listeners: Array<() => void> = []
export const html5HistoryAdapter = (): HistoryAdapter => ({
  listen: (listener: () => void): UnregisterCallback => {
    const listenerIndex = listeners.push(listener) - 1
    return () => {
      delete listeners[listenerIndex]
    }
  },
  location: window.location,
  push: ({ search }: Location) => {
    window.history.pushState(window.history.state, document.title, search)
    listeners.forEach(listener => listener())
  },
  replace: ({ search }: Location) => {
    window.history.replaceState(window.history.state, document.title, search)
    listeners.forEach(listener => listener())
  },
})

export type FlatStringy<T extends {}> = {
  [Key in keyof T]: T[Key] extends string ? T[Key] : string
}

export type Parse<T> = (queryString: string) => T

export type Stringify<T> = (state: T) => string

export type Serialisation<T> = {
  parse: Parse<T>
  stringify: Stringify<T>
}

export type Config<T> = {
  history: HistoryAdapter
  serialisation: Serialisation<T>
}

const qsSerialisation = <T extends {}>(): Serialisation<T> => ({
  parse: <T>(queryString: string) => qs.parse(queryString, { ignoreQueryPrefix: true }),
  stringify: <T>(state: Partial<T>) => qs.stringify(state, { addQueryPrefix: true }),
})

const parseConfig = <T extends {}>(config: Partial<Config<T>> = {}): Config<T> => ({
  history: config.history || html5HistoryAdapter(),
  // TODO switch to using https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/entries to avoid the dependency on qs
  serialisation: config.serialisation || qsSerialisation(),
})

export function useUrlState<T extends {}, ParseResult = FlatStringy<T>>(
  initialState: ParseResult,
  config?: Partial<Config<ParseResult>>,
): [
  ParseResult,
  (newState: SetStateAction<ParseResult>, historyAction?: HistoryAction) => void,
] {
  const { history, serialisation } = useMemo(() => parseConfig(config), [config])
  const [currentState, setSearch] = useState<ParseResult>({
    ...initialState,
    ...serialisation.parse(history.location.search),
  } as ParseResult)

  useEffect(() => {
    history.replace({
      ...history.location,
      search: serialisation.stringify(currentState),
    })
    return history.listen(function onLocationChange() {
      setSearch(serialisation.parse(history.location.search))
    })
  }, [history])

  function setUrlState(
    setStateAction: ParseResult | ((prevState: ParseResult) => ParseResult),
    historyAction?: HistoryAction,
  ): void {
    setSearch(previousState => {
      const newState =
        typeof setStateAction === 'function'
          ? (setStateAction as Function)(previousState)
          : {
              ...previousState,
              ...setStateAction,
            }

      const nextLocation = {
        ...history.location,
        search: serialisation.stringify(newState),
      }

      historyAction === 'replace'
        ? history.replace(nextLocation)
        : history.push(nextLocation)

      return newState
    })
  }

  return [currentState, setUrlState]
}

export type UrlStateProps<T extends {}> = {
  setUrlState: (newState: FlatStringy<T>, historyAction?: HistoryAction) => void
  urlState: FlatStringy<T>
}

export type Props<T extends {}> = {
  config?: Partial<Config<FlatStringy<T>>>
  initialState: FlatStringy<T>
  render: (renderProps: UrlStateProps<T>) => ReactElement
}

export const UrlState = <T extends {}>(props: Props<T>) => {
  const [urlState, setUrlState] = useUrlState<T>(props.initialState, props.config)
  return props.render({ setUrlState, urlState })
}

export type PropEnhancer<Props, MappedProps> = (
  component: ComponentType<MappedProps>,
) => ComponentType<Props>

export const withUrlState = <T extends {}, OP = {}>(
  getInitialState: (props: OP) => FlatStringy<T>,
  config: Partial<Config<FlatStringy<T>>> = {},
): PropEnhancer<OP, OP & UrlStateProps<T>> => (
  WrappedComponent: ComponentType<OP & UrlStateProps<T>>,
): ComponentType<OP> => (props: OP) => {
  const [urlState, setUrlState] = useUrlState<T>(getInitialState(props), config)
  return createElement(WrappedComponent, {
    ...props,
    urlState,
    setUrlState,
  } as OP & UrlStateProps<T>)
}

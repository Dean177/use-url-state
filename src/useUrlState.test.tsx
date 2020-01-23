import {
  createBrowserHistory,
  createMemoryHistory,
  History,
  LocationDescriptorObject,
  LocationListener,
} from 'history'
import * as qs from 'qs'
import * as queryString from 'query-string'
import React, { ReactElement, SetStateAction } from 'react'
import { act, cleanup, fireEvent, render } from 'react-testing-library'
import {
  Config,
  HistoryAction,
  HistoryAdapter,
  html5HistoryAdapter,
  useUrlState,
} from './useUrlState'

type ControlState = { animal?: string; color: string }

type UrlStateProps<T> = {
  urlState: T
  setUrlState: (newState: SetStateAction<T>, historyAction?: HistoryAction) => void
}
const UrlBasedControls = (props: UrlStateProps<ControlState>) => (
  <div>
    <div data-testid="currentAnimal">{props.urlState.animal}</div>
    <div data-testid="currentColor">{props.urlState.color}</div>
    <button
      data-testid="Green"
      onClick={() => props.setUrlState({ ...props.urlState, color: 'Green' })}
    >
      Green
    </button>
    <button
      data-testid="Red"
      onClick={() => props.setUrlState({ ...props.urlState, color: 'Red' })}
    >
      Red
    </button>
  </div>
)

// See https://github.com/kentcdodds/react-testing-library/issues/215 for why this is necessary
const effectfulRender = (jsx: ReactElement<any>) => {
  const wrapper = render(jsx)
  wrapper.rerender(jsx)
  return wrapper
}

const parseQueryString = (str: any) => qs.parse(str, { ignoreQueryPrefix: true })

describe('useUrlState', () => {
  afterEach(cleanup)

  let testHistory: History = null as any
  beforeEach(() => {
    testHistory = createBrowserHistory()
    const newLocation: LocationDescriptorObject = {
      ...testHistory.location,
      search: qs.stringify({ color: 'Blue' }),
    }
    testHistory.replace(newLocation)
  })

  it('sanity checks the before hook', () => {
    expect(parseQueryString(testHistory.location.search)).toEqual({ color: 'Blue' })
  })

  it('will not override any params which are already provided in the query string', () => {
    const UrlConnectedControls = () => {
      const [urlState, setUrlState] = useUrlState<ControlState>(
        { color: 'Red' },
        { history: testHistory },
      )
      return <UrlBasedControls setUrlState={setUrlState} urlState={urlState} />
    }

    const wrapper = effectfulRender(<UrlConnectedControls />)

    expect(parseQueryString(window.location.search)).toEqual({ color: 'Blue' })
    expect(wrapper.getByTestId('currentColor').textContent).toBe('Blue')
  })

  it('will append any additional any params which are not provided in the querystring', () => {
    const UrlConnectedControls = () => {
      const [urlState, setUrlState] = useUrlState<ControlState>(
        { animal: 'Ant', color: 'Blue' },
        { history: testHistory },
      )
      return <UrlBasedControls urlState={urlState} setUrlState={setUrlState} />
    }

    const wrapper = effectfulRender(<UrlConnectedControls />)

    expect(parseQueryString(testHistory.location.search)).toEqual({
      animal: 'Ant',
      color: 'Blue',
    })
    expect(wrapper.getByTestId('currentAnimal').textContent).toBe('Ant')
    expect(wrapper.getByTestId('currentColor').textContent).toBe('Blue')
  })

  it('sets the url with the initial state', () => {
    const UrlConnectedControls = () => {
      const [urlState, setUrlState] = useUrlState<ControlState>(
        { animal: 'Ant', color: 'Blue' },
        { history: testHistory },
      )
      return <UrlBasedControls setUrlState={setUrlState} urlState={urlState} />
    }

    effectfulRender(<UrlConnectedControls />)

    expect(parseQueryString(testHistory.location.search)).toEqual({
      animal: 'Ant',
      color: 'Blue',
    })
  })

  it('provides the current urls state to the wrapped component', () => {
    const UrlConnectedControls = () => {
      const [urlState, setUrlState] = useUrlState<ControlState>(
        { animal: 'Ant', color: 'Blue' },
        { history: testHistory },
      )
      return <UrlBasedControls setUrlState={setUrlState} urlState={urlState} />
    }

    const wrapper = render(<UrlConnectedControls />)

    expect(wrapper.getByTestId('currentAnimal').textContent).toBe('Ant')
    expect(wrapper.getByTestId('currentColor').textContent).toBe('Blue')
  })

  it('updates the url when the wrapped component updates the state', () => {
    const UrlConnectedControls = () => {
      const [urlState, setUrlState] = useUrlState<ControlState>(
        { animal: 'Ant', color: 'Blue' },
        { history: testHistory },
      )
      return <UrlBasedControls setUrlState={setUrlState} urlState={urlState} />
    }

    const wrapper = effectfulRender(<UrlConnectedControls />)
    expect(wrapper.getByTestId('currentAnimal').textContent).toBe('Ant')
    expect(wrapper.getByTestId('currentColor').textContent).toBe('Blue')
    expect(parseQueryString(testHistory.location.search)).toEqual({
      animal: 'Ant',
      color: 'Blue',
    })

    act(() => {
      fireEvent.click(wrapper.getByTestId('Green'))
      wrapper.rerender(<UrlConnectedControls />)
    })

    expect(wrapper.getByTestId('currentAnimal').textContent).toBe('Ant')
    expect(wrapper.getByTestId('currentColor').textContent).toBe('Green')
    expect(parseQueryString(testHistory.location.search)).toEqual({
      animal: 'Ant',
      color: 'Green',
    })
  })

  it('updates the wrapped component state when the url changes', () => {
    const UrlConnectedControls = () => {
      const [urlState, setUrlState] = useUrlState<ControlState>(
        { animal: 'Ant', color: 'Blue' },
        { history: testHistory },
      )
      return <UrlBasedControls setUrlState={setUrlState} urlState={urlState} />
    }

    const wrapper = effectfulRender(<UrlConnectedControls />)
    expect(wrapper.getByTestId('currentAnimal').textContent).toBe('Ant')
    expect(wrapper.getByTestId('currentColor').textContent).toBe('Blue')
    expect(parseQueryString(testHistory.location.search)).toEqual({
      animal: 'Ant',
      color: 'Blue',
    })

    act(() => {
      fireEvent.click(wrapper.getByTestId('Green'))
      wrapper.rerender(<UrlConnectedControls />)
    })

    expect(wrapper.getByTestId('currentAnimal').textContent).toBe('Ant')
    expect(wrapper.getByTestId('currentColor').textContent).toBe('Green')
    expect(parseQueryString(testHistory.location.search)).toEqual({
      animal: 'Ant',
      color: 'Green',
    })
  })

  describe('setUrlState', () => {
    it('takes an optional parameter used to decide if the new search is pushed or replaced', () => {
      const memoryHistory = createMemoryHistory()
      let capturedProps: UrlStateProps<ControlState> = null!
      const UrlConnectedControls = () => {
        let [urlState, setUrlState] = useUrlState(
          { animal: 'Bat', color: 'blue' },
          {
            history: memoryHistory,
          },
        )
        capturedProps = { urlState, setUrlState }
        return <UrlBasedControls urlState={urlState} setUrlState={setUrlState} />
      }

      effectfulRender(<UrlConnectedControls />)
      const { setUrlState } = capturedProps
      act(() => {
        setUrlState({ color: 'Green' }, 'push')
        setUrlState({ color: 'Blue' }, 'push')
      })

      expect(memoryHistory.action).toBe('PUSH')
    })

    it('takes an optional parameter used to replaced the existing state', () => {
      const memoryHistory = createMemoryHistory()
      let capturedProps: UrlStateProps<ControlState>
      const UrlConnectedControls = () => {
        let [urlState, setUrlState] = useUrlState(
          { animal: 'Bat', color: 'blue' },
          {
            history: memoryHistory,
          },
        )
        capturedProps = { urlState, setUrlState }
        return <UrlBasedControls urlState={urlState} setUrlState={setUrlState} />
      }

      effectfulRender(<UrlConnectedControls />)
      const { setUrlState, urlState } = capturedProps

      const nextState = { animal: 'Cat', color: 'cyan' }
      act(() => {
        setUrlState(nextState, 'replace')
      })

      expect(memoryHistory.action).toBe('REPLACE')
    })

    describe('history', () => {
      it('can accept a history provider to use alternate implementations', () => {
        const memoryHistory = createMemoryHistory()
        const UrlConnectedControls = () => {
          let [urlState, setUrlState] = useUrlState(
            { color: 'Red' },
            {
              history: memoryHistory,
            },
          )
          return <UrlBasedControls urlState={urlState} setUrlState={setUrlState} />
        }

        effectfulRender(<UrlConnectedControls />)

        expect(parseQueryString(memoryHistory.location.search)).toEqual({ color: 'Red' })
        expect(memoryHistory.entries.length).toBe(1)
      })

      it('calls the unsubscribe of the HistoryAdapter when the component is unmounted', () => {
        const unsubscribeCallback = jest.fn()
        const unsubscribeHistory: HistoryAdapter = {
          location: {
            pathname: 'pathname',
            search: '?search',
          },
          listen: (listener: LocationListener) => unsubscribeCallback,
          push: (location: LocationDescriptorObject) => {}, // tslint:disable-line
          replace: (location: LocationDescriptorObject) => {}, // tslint:disable-line
        }

        const UrlConnectedControls = () => {
          let [urlState, setUrlState] = useUrlState(
            { animal: 'Ant', color: 'Blue' },
            {
              history: unsubscribeHistory,
            },
          )
          return <UrlBasedControls urlState={urlState} setUrlState={setUrlState} />
        }

        const { unmount } = render(<UrlConnectedControls />)
        unmount()

        expect(unsubscribeCallback).toHaveBeenCalled()
      })
    })

    describe('serialisation', () => {
      it('accepts a custom parse and stringify', () => {
        const config: Partial<Config<ControlState>> = {
          history: testHistory,
          serialisation: {
            parse: queryString.parse as any,
            stringify: queryString.stringify,
          },
        }
        const UrlConnectedControls = () => {
          let [urlState, setUrlState] = useUrlState({ color: 'Red' }, config)
          return <UrlBasedControls urlState={urlState} setUrlState={setUrlState} />
        }

        expect(parseQueryString(testHistory.location.search)).toEqual({ color: 'Blue' })

        const wrapper = render(<UrlConnectedControls />)

        expect(parseQueryString(testHistory.location.search)).toEqual({ color: 'Blue' })
        expect(wrapper.getByTestId('currentColor').textContent).toBe('Blue')
      })

      it('supports complex serialisation workflows', () => {
        type SortOptions =
          | 'BEST_MATCH'
          | 'NEWLY_LISTED'
          | 'NEARBY'
          | 'ENDING_SOON'
          | 'HIGHEST_PAY'
          | 'LOWEST_PAY'

        type QueryParams = {
          q?: string
          page: number
          sort: SortOptions
          min_price?: number
          max_price?: number
        }
        const defaultSort: SortOptions = 'BEST_MATCH'
        const defaultQueryParameters: QueryParams = {
          q: 'Winchester',
          page: 1,
          sort: defaultSort,
        }

        const sortAlphabeticalWithQFirst = (a: string, b: string): number => {
          if (a < b || a === 'q') {
            return -1
          } else if (a > b || b === 'q') {
            return 1
          } else {
            return 0
          }
        }

        const config: Partial<Config<QueryParams>> = {
          history: testHistory,
          serialisation: {
            parse: (queryStr: string): QueryParams => {
              const stringyParams = qs.parse(queryStr, { ignoreQueryPrefix: true })
              if (typeof stringyParams === 'object') {
                const pageFromQuery =
                  typeof stringyParams.page === 'string'
                    ? parseInt(stringyParams.page, 10)
                    : undefined

                const maxPriceAsNumber = parseInt(stringyParams.max_price || '', 10)
                const minPriceAsNumber = parseInt(stringyParams.min_price || '', 10)
                return {
                  q: stringyParams.q || defaultQueryParameters.q,
                  page:
                    pageFromQuery !== undefined && !isNaN(pageFromQuery)
                      ? pageFromQuery
                      : 1,
                  sort: (stringyParams.sort as SortOptions) || defaultSort,
                  max_price: !isNaN(maxPriceAsNumber) ? maxPriceAsNumber : undefined,
                  min_price: !isNaN(minPriceAsNumber) ? minPriceAsNumber : undefined,
                }
              } else {
                return defaultQueryParameters
              }
            },
            stringify: (state: Partial<QueryParams>) => {
              const { max_price, min_price } = state
              const minAndMaxPrice =
                min_price && max_price
                  ? { max_price, min_price }
                  : { max_price: undefined, min_price: undefined }
              const filteredState = {
                q: state.q ? state.q : defaultQueryParameters.q,
                page: state.page === 1 ? undefined : state.page,
                sort: state.sort === defaultSort ? undefined : state.sort,
                ...minAndMaxPrice,
              }

              return qs.stringify(filteredState, {
                addQueryPrefix: true,
                format: 'RFC1738',
                sort: sortAlphabeticalWithQFirst,
              })
            },
          },
        }

        const QueryParamComponent = (props: UrlStateProps<QueryParams>) => (
          <div>
            <div data-testid="max_price">{props.urlState.max_price}</div>
            <div data-testid="min_price">{props.urlState.min_price}</div>
            <div data-testid="page">{props.urlState.page}</div>
            <div data-testid="sort">{props.urlState.sort}</div>
            <div data-testid="q">{props.urlState.q}</div>
          </div>
        )

        const UrlConnectedControls = () => {
          let [urlState, setUrlState] = useUrlState(
            defaultQueryParameters as any,
            config as any,
          )
          return <QueryParamComponent urlState={urlState} setUrlState={setUrlState} />
        }

        const wrapper = effectfulRender(<UrlConnectedControls />)

        expect(testHistory.location.search).toEqual('?q=Winchester')

        expect(wrapper.getByTestId('max_price').textContent).toBe('')
        expect(wrapper.getByTestId('min_price').textContent).toBe('')
        expect(wrapper.getByTestId('page').textContent).toBe('1')
        expect(wrapper.getByTestId('q').textContent).toBe('Winchester')
        expect(wrapper.getByTestId('sort').textContent).toBe('BEST_MATCH')

        act(() => {
          testHistory.replace({
            ...testHistory.location,
            search: config!.serialisation!.stringify({
              max_price: 30,
              min_price: 20,
              page: 3,
              sort: 'NEARBY',
            }),
          })
        })

        expect(testHistory.location.search).toEqual(
          '?max_price=30&min_price=20&page=3&q=Winchester&sort=NEARBY',
        )
        expect(wrapper.getByTestId('max_price').textContent).toBe('30')
        expect(wrapper.getByTestId('min_price').textContent).toBe('20')
        expect(wrapper.getByTestId('page').textContent).toBe('3')
        expect(wrapper.getByTestId('q').textContent).toBe('Winchester')
        expect(wrapper.getByTestId('sort').textContent).toBe('NEARBY')
      })
    })
  })

  describe('html5HistoryAdapter', () => {
    let historyPushTemp = window.history.pushState
    let historyReplaceTemp = window.history.replaceState

    beforeEach(() => {
      window.history.pushState = jest.fn()
      window.history.replaceState = jest.fn()
    })

    afterEach(() => {
      window.history.pushState = historyPushTemp
      window.history.replaceState = historyReplaceTemp
    })

    it(`notifies its listeners for push events`, () => {
      const listener = jest.fn(() => () => {})
      const historyAdapter = html5HistoryAdapter()
      historyAdapter.listen(listener)
      historyAdapter.push({
        pathname: '/',
        search: 'foo=bar',
      })

      expect(window.history.pushState).toHaveBeenCalled()
      expect(listener).toHaveBeenCalled()
    })

    it('notifies its listeners for replace events', () => {
      const listener = jest.fn(() => () => {})
      const historyAdapter = html5HistoryAdapter()
      historyAdapter.listen(listener)
      historyAdapter.replace({
        pathname: '/',
        search: 'foo=bar',
      })

      expect(window.history.replaceState).toHaveBeenCalled()
      expect(listener).toHaveBeenCalled()
    })
  })
})

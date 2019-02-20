import {
  createBrowserHistory,
  createMemoryHistory,
  History,
  LocationDescriptorObject,
  LocationListener,
} from 'history'
import { flow } from 'lodash'
import { interceptor } from 'props-interceptor'
import qs from 'qs'
import queryString from 'query-string'
import React, { ReactElement } from 'react'
import { cleanup, fireEvent, render } from 'react-testing-library'
import {
  HistoryAdapter,
  HocConfig,
  html5HistoryAdapter,
  UrlState,
  UrlStateProps,
  useUrlState,
  withUrlState,
} from './withUrlState'

type ControlState = { animal?: string; color: string }

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

    fireEvent.click(wrapper.getByTestId('Green'))
    wrapper.rerender(<UrlConnectedControls />)

    expect(wrapper.getByTestId('currentAnimal').textContent).toBe('Ant')
    expect(wrapper.getByTestId('currentColor').textContent).toBe('Green')
    expect(parseQueryString(testHistory.location.search)).toEqual({
      animal: 'Ant',
      color: 'Green',
    })
  })

  describe('render props API', () => {
    it('sets the url with the initial state', () => {
      render(
        <UrlState<ControlState>
          initialState={{ animal: 'Ant', color: 'Blue' }}
          config={{ history: testHistory }}
          render={({ setUrlState, urlState }: UrlStateProps<ControlState>) => (
            <UrlBasedControls setUrlState={setUrlState} urlState={urlState} />
          )}
        />,
      )

      expect(parseQueryString(testHistory.location.search)).toEqual({
        animal: 'Ant',
        color: 'Blue',
      })
    })
  })

  describe('config', () => {
    describe('shouldPushState', () => {
      it('takes a predicate used to decide if the new search is pushed or replaced', () => {
        const propSpy = jest.fn()
        const memoryHistory = createMemoryHistory()
        const hocConfig: Partial<HocConfig<ControlState, {}>> = {
          history: memoryHistory,
          shouldPushState: () => (n: ControlState, p: ControlState) => true,
        }
        const UrlConnectedControls = flow(
          interceptor((props: UrlStateProps<ControlState>) => propSpy(props)),
          withUrlState<ControlState, {}>(() => ({ color: 'Red' }), hocConfig),
        )(UrlBasedControls)

        effectfulRender(<UrlConnectedControls />)
        const { setUrlState } = propSpy.mock.calls[0][0]
        setUrlState({ color: 'Green' })
        setUrlState({ color: 'Blue' })
        expect(memoryHistory.action).toBe('PUSH')
        expect(memoryHistory.entries.length).toBe(3)
      })

      it('allows comparison of the *parsed* state to be applied and the current state', () => {
        const shouldPushState = jest.fn()
        const capturedProps: Array<UrlStateProps<ControlState>> = []
        const UrlConnectedControls = flow(
          interceptor((props: UrlStateProps<ControlState>) => capturedProps.push(props)),
          withUrlState<ControlState>(() => ({ animal: 'Bat', color: 'blue' }), {
            history: testHistory,
            shouldPushState: () => shouldPushState,
          }),
        )(UrlBasedControls)

        effectfulRender(<UrlConnectedControls />)
        const { setUrlState, urlState } = capturedProps[0]

        const nextState = { animal: 'Cat', color: 'cyan' }
        setUrlState(nextState)

        expect(shouldPushState).toBeCalledWith(nextState, urlState)
      })
    })

    describe('history', () => {
      it('can accept a history provider to use alternate implementations', () => {
        const memoryHistory = createMemoryHistory()
        const enhance = withUrlState<ControlState>(() => ({ color: 'Red' }), {
          history: memoryHistory,
        })
        const UrlConnectedControls = enhance(UrlBasedControls)

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
            hash: '',
          },
          listen: (listener: LocationListener) => unsubscribeCallback,
          push: (location: LocationDescriptorObject) => {}, // tslint:disable-line
          replace: (location: LocationDescriptorObject) => {}, // tslint:disable-line
        }

        const enhance = withUrlState<ControlState>(
          () => ({ animal: 'Ant', color: 'Blue' }),
          {
            history: unsubscribeHistory,
          },
        )

        const UrlConnectedControls = enhance(UrlBasedControls)

        const { unmount } = render(<UrlConnectedControls />)
        unmount()

        expect(unsubscribeCallback).toHaveBeenCalled()
      })
    })

    describe('serialisation', () => {
      it('accepts a custom parse and stringify', () => {
        const config: Partial<HocConfig<ControlState, {}>> = {
          history: testHistory,
          serialisation: {
            parse: queryString.parse as any,
            stringify: queryString.stringify,
          },
        }
        const UrlConnectedControls = withUrlState<ControlState>(
          () => ({ color: 'Red' }),
          config,
        )(UrlBasedControls)
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

        const config: Partial<HocConfig<QueryParams, {}>> = {
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

        const UrlConnectedControls = withUrlState<QueryParams>(
          () => defaultQueryParameters,
          config,
        )(QueryParamComponent)

        const wrapper = effectfulRender(<UrlConnectedControls />)

        expect(testHistory.location.search).toEqual('?q=Winchester')

        expect(wrapper.getByTestId('max_price').textContent).toBe('')
        expect(wrapper.getByTestId('min_price').textContent).toBe('')
        expect(wrapper.getByTestId('page').textContent).toBe('1')
        expect(wrapper.getByTestId('q').textContent).toBe('Winchester')
        expect(wrapper.getByTestId('sort').textContent).toBe('BEST_MATCH')

        testHistory.replace({
          ...testHistory.location,
          search: config!.serialisation!.stringify({
            max_price: 30,
            min_price: 20,
            page: 3,
            sort: 'NEARBY',
          }),
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
    const listener = () => {} // tslint:disable-line
    let addTemp = window.addEventListener
    let removeTemp = window.removeEventListener
    let dispatchTemp = window.dispatchEvent
    let historyPushTemp = window.history.pushState
    let historyReplaceTemp = window.history.replaceState

    beforeEach(() => {
      window.addEventListener = jest.fn()
      window.dispatchEvent = jest.fn()
      window.removeEventListener = jest.fn()
      window.history.pushState = jest.fn()
      window.history.replaceState = jest.fn()
    })

    afterEach(() => {
      window.addEventListener = addTemp
      window.dispatchEvent = dispatchTemp
      window.removeEventListener = removeTemp
      window.history.pushState = historyPushTemp
      window.history.replaceState = historyReplaceTemp
    })

    it(`registers itself as an event listener of 'popstate'`, () => {
      html5HistoryAdapter.listen(listener)
      expect(window.addEventListener).toHaveBeenCalledWith('popstate', listener)
    })

    it(`returns a callback which will remove itself as an event listener of 'popstate'`, () => {
      const unsubscribe = html5HistoryAdapter.listen(listener)
      unsubscribe()
      expect(window.removeEventListener).toHaveBeenCalledWith('popstate', listener)
    })

    it(`defers to the 'history' global when pushing an event`, () => {
      html5HistoryAdapter.listen(listener)
      html5HistoryAdapter.push({ search: 'foo=bar' })

      expect(window.history.pushState).toHaveBeenCalled()
      expect(window.dispatchEvent).toHaveBeenCalled()
    })

    it(`defers to the 'history' global when replacing an event`, () => {
      html5HistoryAdapter.listen(listener)
      html5HistoryAdapter.replace({ search: 'foo=bar' })

      expect(window.history.replaceState).toHaveBeenCalled()
      expect(window.dispatchEvent).toHaveBeenCalled()
    })
  })
})

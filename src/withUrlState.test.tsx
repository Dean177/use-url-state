// tslint:disable:no-any
import { mount } from 'enzyme'
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
import React from 'react'
import {
  HistoryAdapter,
  withUrlState,
  UrlStateProps,
  Config,
  Parse,
  Stringify,
  html5HistoryAdapter,
} from './withUrlState'

type ControlState = { animal?: string; color: string }
declare const global: { window: Window }

const UrlBasedControls = (props: UrlStateProps<ControlState>) => (
  <div>
    <div className="currentAnimal">{props.urlState.animal}</div>
    <div className="currentColor">{props.urlState.color}</div>
    <button className="Green" onClick={() => props.setUrlState({ color: 'Green' })}>
      Green
    </button>
    <button className="Red" onClick={() => props.setUrlState({ color: 'Red' })}>
      Red
    </button>
  </div>
)

const parseQueryString: Parse<ControlState> = str =>
  qs.parse(str, { ignoreQueryPrefix: true })
const stringifyState: Stringify<ControlState> = state =>
  qs.stringify(state, { addQueryPrefix: true })

describe('withUrlState', () => {
  let testHistory: History = null as any

  beforeEach(() => {
    testHistory = createBrowserHistory()
    const newLocation: LocationDescriptorObject = {
      ...testHistory.location,
      search: qs.stringify({ color: 'Blue' }),
    }
    testHistory.replace(newLocation)
  })

  it('will not override any params which are already provided in the query string', () => {
    const enhance = withUrlState<ControlState>(() => ({ color: 'Red' }), {
      history: testHistory,
    })
    const UrlConnectedControls = enhance(UrlBasedControls)

    expect(parseQueryString(window.location.search)).toEqual({ color: 'Blue' })

    const wrapper = mount(<UrlConnectedControls />)

    expect(parseQueryString(window.location.search)).toEqual({ color: 'Blue' })
    expect(wrapper.find('.currentColor').text()).toBe('Blue')
  })

  it('will append any additional any params which are not provided in the querystring', () => {
    const UrlConnectedControls = withUrlState<ControlState>(
      () => ({ animal: 'Ant', color: 'Blue' }),
      { history: testHistory },
    )(UrlBasedControls)
    expect(parseQueryString(testHistory.location.search)).toEqual({ color: 'Blue' })

    const wrapper = mount(<UrlConnectedControls />)

    expect(parseQueryString(testHistory.location.search)).toEqual({
      animal: 'Ant',
      color: 'Blue',
    })
    expect(wrapper.find('.currentAnimal').text()).toBe('Ant')
    expect(wrapper.find('.currentColor').text()).toBe('Blue')
  })

  it('sets the url with the initial state', () => {
    const UrlConnectedControls = withUrlState<ControlState>(
      () => ({ animal: 'Ant', color: 'Blue' }),
      { history: testHistory },
    )(UrlBasedControls)
    expect(parseQueryString(testHistory.location.search)).toEqual({ color: 'Blue' })

    mount(<UrlConnectedControls />)

    expect(parseQueryString(testHistory.location.search)).toEqual({
      animal: 'Ant',
      color: 'Blue',
    })
  })

  it('provides the current urls state to the wrapped component', () => {
    const UrlConnectedControls = withUrlState<ControlState>(
      () => ({ animal: 'Ant', color: 'Blue' }),
      { history: testHistory },
    )(UrlBasedControls)

    const wrapper = mount(<UrlConnectedControls />)

    expect(wrapper.find('.currentAnimal').text()).toBe('Ant')
    expect(wrapper.find('.currentColor').text()).toBe('Blue')
  })

  it('updates the url when the wrapped component updates the state', () => {
    const UrlConnectedControls = withUrlState<ControlState>(
      () => ({ animal: 'Ant', color: 'Blue' }),
      { history: testHistory },
    )(UrlBasedControls)

    const wrapper = mount(<UrlConnectedControls />)
    expect(wrapper.find('.currentAnimal').text()).toBe('Ant')
    expect(wrapper.find('.currentColor').text()).toBe('Blue')
    expect(parseQueryString(testHistory.location.search)).toEqual({
      animal: 'Ant',
      color: 'Blue',
    })

    wrapper.find('.Green').simulate('click')
    expect(wrapper.find('.currentAnimal').text()).toBe('Ant')
    expect(wrapper.find('.currentColor').text()).toBe('Green')
    expect(parseQueryString(testHistory.location.search)).toEqual({
      animal: 'Ant',
      color: 'Green',
    })
  })

  describe('config', () => {
    describe('shouldPushState', () => {
      it('takes a predicate used to decide if the new search is pushed or replaced', () => {
        const propSpy = jest.fn()
        const memoryHistory = createMemoryHistory()
        const UrlConnectedControls = flow(
          interceptor((props: UrlStateProps<ControlState>) => propSpy(props)),
          withUrlState<ControlState>(() => ({ color: 'Red' }), {
            history: memoryHistory,
            shouldPushState: () => true,
          }),
        )(UrlBasedControls)

        mount(<UrlConnectedControls />)
        const { setUrlState } = propSpy.mock.calls[0][0]
        setUrlState({ color: 'Green' })
        setUrlState({ color: 'Blue' })
        expect(memoryHistory.action).toBe('PUSH')
        expect(memoryHistory.entries.length).toBe(3)
      })

      it('allows comparison of the *parsed* state to be applied and the current state', () => {
        const parse = (str: string): Partial<ControlState> => {
          const state = qs.parse(str, { ignoreQueryPrefix: true })
          return { ...state, animal: state.animal || 'Empty' }
        }
        const stringify = (state: Partial<ControlState>) => {
          const { color, animal } = state
          const filteredState = { color, animal: animal === 'Empty' ? undefined : animal }
          return qs.stringify(filteredState)
        }
        const shouldPushState = jest.fn()

        const config = {
          history: testHistory,
          shouldPushState,
          serialisation: { parse, stringify },
        }

        const propSpy = jest.fn()
        const UrlConnectedControls = flow(
          interceptor((props: UrlStateProps<ControlState>) => propSpy(props)),
          withUrlState<ControlState>(() => ({ animal: 'bear', color: 'blue' }), config),
        )(UrlBasedControls)

        mount(<UrlConnectedControls />)
        const { setUrlState } = propSpy.mock.calls[0][0]
        setUrlState({ animal: 'Cat', otherErroneousParam: 'foo' })

        const next = { color: 'Blue', animal: 'Cat' }
        const current = { color: 'Blue', animal: 'Empty' }
        expect(shouldPushState).toBeCalledWith({}, next, current)
      })
    })

    describe('history', () => {
      it('can accept a history provider to use alternate implementations', () => {
        const memoryHistory = createMemoryHistory()
        const enhance = withUrlState<ControlState>(() => ({ color: 'Red' }), {
          history: memoryHistory,
        })
        const UrlConnectedControls = enhance(UrlBasedControls)

        mount(<UrlConnectedControls />)

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

        const wrapper = mount(<UrlConnectedControls />)
        wrapper.unmount()

        expect(unsubscribeCallback).toHaveBeenCalled()
      })
    })

    describe('serialisation', () => {
      it('accepts a custom parse and stringify', () => {
        const config = {
          history: testHistory,
          serialisation: {
            parse: queryString.parse,
            stringify: queryString.stringify,
          },
        }
        const UrlConnectedControls = withUrlState<ControlState>(
          () => ({ color: 'Red' }),
          config,
        )(UrlBasedControls)
        expect(parseQueryString(testHistory.location.search)).toEqual({ color: 'Blue' })

        const wrapper = mount(<UrlConnectedControls />)

        expect(parseQueryString(testHistory.location.search)).toEqual({ color: 'Blue' })
        expect(wrapper.find('.currentColor').text()).toBe('Blue')
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
          q: string
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

        const config: Config<QueryParams> = {
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
            <div className="max_price">{props.urlState.max_price}</div>
            <div className="min_price">{props.urlState.min_price}</div>
            <div className="page">{props.urlState.page}</div>
            <div className="sort">{props.urlState.sort}</div>
            <div className="q">{props.urlState.q}</div>
          </div>
        )

        const UrlConnectedControls = withUrlState<QueryParams>(
          () => defaultQueryParameters,
          config,
        )(QueryParamComponent)

        const wrapper = mount(<UrlConnectedControls />)

        expect(testHistory.location.search).toEqual('?q=Winchester')

        expect(wrapper.find('.max_price').text()).toBe('')
        expect(wrapper.find('.min_price').text()).toBe('')
        expect(wrapper.find('.page').text()).toBe('1')
        expect(wrapper.find('.q').text()).toBe('Winchester')
        expect(wrapper.find('.sort').text()).toBe('BEST_MATCH')

        testHistory.replace({
          ...testHistory.location,
          search: config!.serialisation!.stringify({
            max_price: 30,
            min_price: 20,
            page: 3,
            sort: 'NEARBY',
          }),
        })
        wrapper.update()

        expect(testHistory.location.search).toEqual(
          '?max_price=30&min_price=20&page=3&q=Winchester&sort=NEARBY',
        )
        expect(wrapper.find('.max_price').text()).toBe('30')
        expect(wrapper.find('.min_price').text()).toBe('20')
        expect(wrapper.find('.page').text()).toBe('3')
        expect(wrapper.find('.q').text()).toBe('Winchester')
        expect(wrapper.find('.sort').text()).toBe('NEARBY')
      })
    })
  })

  describe('html5HistoryAdapter', () => {
    const listener = () => {} // tslint:disable-line
    let addTemp = window.addEventListener
    let removeTemp = window.removeEventListener
    let historyPushTemp = window.history.pushState
    let historyReplaceTemp = window.history.replaceState

    beforeEach(() => {
      window.addEventListener = jest.fn()
      window.removeEventListener = jest.fn()
      window.history.pushState = jest.fn()
      window.history.replaceState = jest.fn()
    })

    afterEach(() => {
      window.addEventListener = addTemp
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
    })

    it(`defers to the 'history' global when replacing an event`, () => {
      html5HistoryAdapter.listen(listener)
      html5HistoryAdapter.replace({ search: 'foo=bar' })

      expect(window.history.replaceState).toHaveBeenCalled()
    })
  })
})

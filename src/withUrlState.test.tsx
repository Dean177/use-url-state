// tslint:disable:no-any
import { mount } from 'enzyme'
import { createBrowserHistory, History, LocationDescriptorObject } from 'history'
import createMemoryHistory from 'history/createMemoryHistory'
import * as queryString from 'query-string'
import * as qs from 'qs'
import * as React from 'react'
import { withUrlState, UrlStateProps, Config } from './withUrlState'

type ControlState = { animal?: string, color: string }
declare const global: { window: any }

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

describe('withUrlState', () => {
  let testHistory: History = null as any

  beforeEach(() => {
    testHistory = createBrowserHistory()

    const newLocation: LocationDescriptorObject = {
      ...testHistory.location,
      search: queryString.stringify({ color: 'Blue' }),
    }
    testHistory.replace(newLocation)
  })

  it('will not override any params which are already provided in the query string', () => {
    const UrlConnectedControls: any =
      withUrlState<{}, ControlState>(() => ({ color: 'Red' }), { history: testHistory })(UrlBasedControls)

    expect(queryString.parse(window.location.search)).toEqual({ color: 'Blue' })

    const wrapper = mount(<UrlConnectedControls/>)

    expect(queryString.parse(window.location.search)).toEqual({ color: 'Blue' })
    expect(wrapper.find('.currentColor').text()).toBe('Blue')
  })

  it('will append any additional any params which are not provided in the querystring', () => {
    const UrlConnectedControls: any =
      withUrlState<{}, ControlState>(
        () => ({ animal: 'Ant', color: 'Blue' }),
        { history: testHistory },
      )(UrlBasedControls)
    expect(queryString.parse(testHistory.location.search)).toEqual({ color: 'Blue' })

    const wrapper = mount(<UrlConnectedControls/>)

    expect(queryString.parse(testHistory.location.search)).toEqual({ animal: 'Ant', color: 'Blue' })
    expect(wrapper.find('.currentAnimal').text()).toBe('Ant')
    expect(wrapper.find('.currentColor').text()).toBe('Blue')
  })

  it('sets the url with the initial state', () => {
    const UrlConnectedControls: any =
      withUrlState<{}, ControlState>(
        () => ({ animal: 'Ant', color: 'Blue' }),
        { history: testHistory },
      )(UrlBasedControls)
    expect(queryString.parse(testHistory.location.search)).toEqual({ color: 'Blue' })

    mount(<UrlConnectedControls/>)

    expect(queryString.parse(testHistory.location.search)).toEqual({ animal: 'Ant', color: 'Blue' })
  })

  it('provides the current urls state to the wrapped component', () => {
    const UrlConnectedControls: any =
      withUrlState<{}, ControlState>(
        () => ({ animal: 'Ant', color: 'Blue' }),
        { history: testHistory },
      )(UrlBasedControls)

    const wrapper = mount(<UrlConnectedControls/>)

    expect(wrapper.find('.currentAnimal').text()).toBe('Ant')
    expect(wrapper.find('.currentColor').text()).toBe('Blue')
  })

  it('updates the url when the wrapped component updates the state', () => {
    const UrlConnectedControls: any =
      withUrlState<{}, ControlState>(
        () => ({ animal: 'Ant', color: 'Blue' }),
        { history: testHistory },
      )(UrlBasedControls)

    const wrapper = mount(<UrlConnectedControls/>)
    expect(wrapper.find('.currentAnimal').text()).toBe('Ant')
    expect(wrapper.find('.currentColor').text()).toBe('Blue')
    expect(queryString.parse(testHistory.location.search)).toEqual({ animal: 'Ant', color: 'Blue' })

    wrapper.find('.Green').simulate('click')
    expect(wrapper.find('.currentAnimal').text()).toBe('Ant')
    expect(wrapper.find('.currentColor').text()).toBe('Green')
    expect(queryString.parse(testHistory.location.search)).toEqual({ animal: 'Ant', color: 'Green' })
  })

  describe('config', () => {
    describe('history', () => {
      it('can accept a history provider to use alternate implementations', () => {
        const memoryHistory = createMemoryHistory()
        const UrlConnectedControls: any =
          withUrlState<{}, ControlState>(() => ({ color: 'Red' }), { history: memoryHistory })(UrlBasedControls)

        const wrapper = mount(<UrlConnectedControls/>)

        expect(queryString.parse(memoryHistory.location.search)).toEqual({ color: 'Red' })
        expect(wrapper.find('.currentColor').text()).toBe('Red')
        expect(memoryHistory.entries.length).toBe(1)
      })
    })

    describe('serialisation', () => {
      it('accepts a custom parse and stringify', () => {
        const config = {
          history: testHistory,
          serialisation: {
            parse: (str: string) => qs.parse(str, { ignoreQueryPrefix: true }),
            stringify: qs.stringify,
          },
        }
        const UrlConnectedControls: any =
          withUrlState<{}, ControlState>(() => ({ color: 'Red' }), config)(UrlBasedControls)
        expect(queryString.parse(testHistory.location.search)).toEqual({ color: 'Blue' })

        const wrapper = mount(<UrlConnectedControls/>)

        expect(queryString.parse(testHistory.location.search)).toEqual({ color: 'Blue' })
        expect(wrapper.find('.currentColor').text()).toBe('Blue')
      })

      it('can support complex serialisation workflows', () => {
        type SortOptions = 'BEST_MATCH' | 'NEWLY_LISTED' | 'NEARBY' | 'ENDING_SOON' | 'HIGHEST_PAY' | 'LOWEST_PAY'
        type QueryParams = {
          q: string,
          page: number,
          sort: SortOptions,
          min_price?: number,
          max_price?: number,
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
                const pageFromQuery = (typeof stringyParams.page === 'string')
                  ? parseInt(stringyParams.page, 10)
                  : undefined

                const maxPriceAsNumber = parseInt(stringyParams.max_price || '', 10)
                const minPriceAsNumber = parseInt(stringyParams.min_price || '', 10)
                return {
                  q: stringyParams.q || defaultQueryParameters.q,
                  page: pageFromQuery !== undefined && !isNaN(pageFromQuery) ? pageFromQuery : 1,
                  sort: stringyParams.sort as SortOptions || defaultSort,
                  max_price: !isNaN(maxPriceAsNumber) ? maxPriceAsNumber : undefined,
                  min_price: !isNaN(minPriceAsNumber) ? minPriceAsNumber : undefined,
                }
              } else {
                return defaultQueryParameters
              }
            },
            stringify: (state: Partial<QueryParams>) => {
              const { max_price, min_price } = state
              const minAndMaxPrice = min_price && max_price
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

        const UrlConnectedControls =
          withUrlState<{}, QueryParams>(() => defaultQueryParameters, config)(QueryParamComponent)

        const wrapper = mount(<UrlConnectedControls/>)

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
          })
        })
        wrapper.update()

        expect(testHistory.location.search).toEqual('?q=Winchester&max_price=30&min_price=20&page=3&sort=NEARBY')
        expect(wrapper.find('.max_price').text()).toBe('30')
        expect(wrapper.find('.min_price').text()).toBe('20')
        expect(wrapper.find('.page').text()).toBe('3')
        expect(wrapper.find('.q').text()).toBe('Winchester')
        expect(wrapper.find('.sort').text()).toBe('NEARBY')
      })
    })
  })
})

import { History, Location, LocationDescriptorObject, UnregisterCallback } from 'history'
import * as queryString from 'query-string'
import { Component, ComponentClass, ComponentType, createElement } from 'react'

type Decorator<Props, EnhancedProps> = (component: ComponentType<EnhancedProps>) => ComponentType<Props>

export type FlatStringyObject<T> = { [Key in keyof T]: string }

export type UrlStateProps<T> = {
  setUrlState: (newState: FlatStringyObject<T>) => void,
  urlState: FlatStringyObject<T>,
}

export type InternalState = {
  previousSearch: string,
}

export const withUrlState =
  <OP, T extends object>(
    history: History,
    getInitialState?: (props: OP) => FlatStringyObject<T>,
  ): Decorator<OP, OP & UrlStateProps<T>> =>
    (WrappedComponent: ComponentType<OP & UrlStateProps<T>>): ComponentClass<OP> =>
      class WithUrlStateWrapper extends Component<OP, InternalState> {
        historyListener: UnregisterCallback | null = null
        state = {
          previousSearch: history.location.search,
        }

        componentWillMount() {
          const initialUrlState: T | undefined = getInitialState && getInitialState(this.props)
          this.setUrlState({
            ...queryString.parse(history.location.search),
            ...(initialUrlState as any) // tslint:disable-line:no-any Typescript cant handle generic spread yet
          })
          this.historyListener = history.listen(this.onLocationChange)
        }

        componentWillUnmount() {
          if (this.historyListener) {
            this.historyListener()
          }
        }

        onLocationChange = (location: Location): void => {
          if (location.search !== this.state.previousSearch) {
            this.forceUpdate()
            this.setState({previousSearch: location.search})
          }
        }

        setUrlState = (newState: T): void => {
          const search: string = queryString.stringify({
            ...queryString.parse(history.location.search),
            ...(newState as any), // tslint:disable-line:no-any Typescript cant handle generic spread yet
          })

          const newLocation: LocationDescriptorObject = {
            ...history.location,
            search,
          }

          history.replace(newLocation)
        }

        render() {
          const enhancedProps = {
            ...(this.props as any), // tslint:disable-line:no-any Typescript cant handle generic spread yet
            setUrlState: this.setUrlState,
            urlState: queryString.parse(history.location.search),
          }

          return createElement(
            WrappedComponent as ComponentClass<OP & UrlStateProps<T>>,
            enhancedProps,
          )
        }
      }

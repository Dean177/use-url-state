import { History, LocationDescriptorObject } from 'history';
import { assign } from 'lodash';
import * as queryString from 'query-string';
import { Component, ComponentClass, ComponentType, createElement } from 'react';

type Decorator<Props, EnhancedProps> = (component: ComponentType<EnhancedProps>) => ComponentType<Props>;

export type FlatStringyObject<T> = { [Key in keyof T]: string };

export type UrlStateProps<T> = {
  setUrlState: (newState: FlatStringyObject<T>) => void,
  urlState: FlatStringyObject<T>,
};
export const withUrlState =
  <OP, T extends object>(history: History, initialState: FlatStringyObject<T>): Decorator<OP, OP & UrlStateProps<T>> =>
    (WrappedComponent: ComponentType<OP & UrlStateProps<T>>): ComponentClass<OP> =>
      class WithUrlStateWrapper extends Component<OP> {
        componentWillMount() {
          this.setUrlState(initialState as T)
        }

        setUrlState = (newState: T): void => {
          const search: string = queryString.stringify(assign({},
            queryString.parse(history.location.search),
            newState,
          ));

          const newLocation: LocationDescriptorObject = {
            ...history.location,
            search,
          };

          history.replace(newLocation);
        }

        render() {
          const enhancedProps = assign({}, this.props, {
            setUrlState: this.setUrlState,
            urlState: queryString.parse(history.location.search),
          });
          return createElement(
            WrappedComponent as ComponentClass<OP & UrlStateProps<T>>,
            enhancedProps,
          );
        }
      };

import { Component, ComponentClass, ComponentType, createElement } from 'react';

type Decorator<Props, EnhancedProps> = (component: ComponentType<EnhancedProps>) => ComponentType<Props>;

export type FlatStringyObject<T> = { [Key in keyof T]: string };

export type UrlStateProps<T> = {
  setUrlState: (newState: Partial<T>) => void,
  urlState: T,
};

export type InternalState = {
  previousSearch: string,
};

export const withUrlState =
  <OP, T extends object>(
    parse: (queryString: string) => Partial<T>,
    stringify: (state: Partial<T>) => string,
    getInitialState?: (props: OP) => T,
  ): Decorator<OP, OP & UrlStateProps<T>> =>
    (WrappedComponent: ComponentType<OP & UrlStateProps<T>>): ComponentClass<OP> =>
      class WithUrlStateWrapper extends Component<OP, InternalState> {
        state = {
          previousSearch: window.location.search,
        };
        
        componentWillMount() {
          const initialState: Partial<T> | undefined = getInitialState && getInitialState(this.props);
          const search = stringify(
            {
              ...(parse(window.location.search) as any), // tslint:disable-line:no-any max-line-length Typescript cant handle generic spread yet,
              ...(initialState as any),                  // tslint:disable-line:no-any
            } as Partial<T>
          );

          window.history.replaceState(window.history.state, '', search);
          window.addEventListener('popstate', this.onLocationChange);
        }
        
        componentWillUnmount() {
          window.removeEventListener('popstate', this.onLocationChange);
        }
        
        onLocationChange = () => {
          if (location.search !== this.state.previousSearch) {
            this.forceUpdate(
              () => this.setState({ previousSearch: location.search })
            );
          }
        }
        
        setUrlState = (newState: Partial<T>): void => {
          const search = stringify(
            {
              ...(parse(window.location.search) as any), // tslint:disable-line:no-any max-line-length Typescript cant handle generic spread yet,
              ...(newState as any),                      // tslint:disable-line:no-any
            } as Partial<T>,
          );
          
          window.history.pushState(window.history.state, '', search);
          this.onLocationChange();
        }
        
        render() {
          const enhancedProps = {
            ...(this.props as any), // tslint:disable-line:no-any Typescript cant handle generic spread yet
            setUrlState: this.setUrlState,
            urlState: parse(window.location.search),
          };
          
          return createElement(WrappedComponent, enhancedProps);
        }
      };

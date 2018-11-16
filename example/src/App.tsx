import { url } from 'inspector'
import { Marker } from 'leaflet'
import React from 'react'
import { Map, TileLayer } from 'react-leaflet'
import { Async } from 'with-async'
import { withUrlState, UrlStateProps, UrlState } from 'with-url-state'
import './App.css'

type SearchResults = {
  count: number
  results: Array<{
    name: string
    height: string
    url: string
  }>
}

const characterSearch = (name: string): Promise<SearchResults> =>
  fetch(`https://swapi.co/api/people/?search=${name}`).then(r => r.json())

type FormState = { name: string }
export const UrlSearchForm = () => (
  <UrlState<FormState>
    initialState={{ name: 'Skywalker' }}
    render={({ urlState, setUrlState }) => (
      <div>
        <input
          onChange={e => setUrlState({ name: e.target.value })}
          value={urlState.name}
        />
        <Async
          producer={() => characterSearch(urlState.name)}
          render={({ error, isLoading, result }) => (
            <div>
              <pre>{JSON.stringify({ error, isLoading, result }, null, 2)}</pre>
              {isLoading && <p>Loading</p>}
              {result != null &&
                result.results.map(character => (
                  <div key={character.url}>{character.name}</div>
                ))}
            </div>
          )}
        />
      </div>
    )}
  />
)

type MapState = { lat: string; lng: string }
export const MapRegion = () => (
  <UrlState<MapState>
    initialState={{ lat: '0', lng: '0' }}
    render={({ urlState, setUrlState }) => (
      <div>
        <div>{JSON.stringify(urlState)}</div>
        {/*<Map*/}
        {/*center={{lat: Number(urlState.lat), lng: Number(urlState.lng)}}*/}
        {/*zoom={13}*/}
        {/*>*/}
        {/*<TileLayer*/}
        {/*attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'*/}
        {/*url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"*/}
        {/*/>*/}
        {/*</Map>*/}
      </div>
    )}
  />
)

type ColorState = { color: string }
const enhance = withUrlState<ColorState, {}>(() => ({ color: 'blue' }))

export const ColorPicker = enhance((props: UrlStateProps<ColorState>) => (
  <div className="UrlForm" style={{ backgroundColor: props.urlState.color }}>
    <div className="current-state">
      <div>{props.urlState.color}</div>
    </div>
    <div className="color-buttons">
      <button className="Red" onClick={() => props.setUrlState({ color: 'red' })}>
        Red
      </button>
      <button className="Green" onClick={() => props.setUrlState({ color: 'green' })}>
        Green
      </button>
      <button className="Blue" onClick={() => props.setUrlState({ color: 'blue' })}>
        Blue
      </button>
    </div>
  </div>
))

export default () => <UrlSearchForm />

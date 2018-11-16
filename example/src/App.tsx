import React from 'react'
import { Map, TileLayer } from 'react-leaflet'
import { Async } from 'with-async'
import { withUrlState, UrlStateProps, UrlState } from 'with-url-state'
import 'leaflet/dist/leaflet.css'
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
export const SearchForm = () => (
  <UrlState<FormState>
    initialState={{ name: 'Skywalker' }}
    render={({ urlState, setUrlState }) => (
      <div>
        <input
          placeholder="Search"
          onChange={e => setUrlState({ name: e.target.value })}
          style={{
            paddingBottom: 5,
            paddingLeft: 10,
            paddingRight: 10,
            paddingTop: 5,
            marginBottom: 20,
          }}
          value={urlState.name}
        />
        <Async
          producer={() => characterSearch(urlState.name)}
          render={({ error, isLoading, result }) => (
            <div>
              {isLoading && <p>Loading</p>}
              {result != null &&
                result.results.map(character => (
                  <div
                    key={character.url}
                    style={{
                      padding: 10,
                    }}
                  >
                    {character.name}
                  </div>
                ))}
            </div>
          )}
        />
      </div>
    )}
  />
)

type MapState = { lat: string; lng: string; zoom: string }
export const MapRegion = () => (
  <UrlState<MapState>
    initialState={{ lat: '51.45999681055091', lng: '-2.583847045898438', zoom: '12' }}
    render={({ urlState, setUrlState }) => (
      <div>
        <Map
          center={{ lat: Number(urlState.lat), lng: Number(urlState.lng) }}
          onViewportChanged={({ center: [lat, lng], zoom }: any) =>
            setUrlState({ lat, lng, zoom })
          }
          zoom={Number(urlState.zoom)}
          style={{
            height: 800,
            width: 600,
          }}
        >
          <TileLayer
            attribution={`&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors`}
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </Map>
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

type ExampleState = { example: 'map' | 'form' | 'color' }
export default () => (
  <UrlState<ExampleState>
    initialState={{ example: 'color' }}
    render={({ urlState, setUrlState }) => (
      <>
        <div className="example-buttons">
          <button
            className={urlState.example === 'color' ? 'active' : ''}
            onClick={() => setUrlState({ example: 'color' })}
          >
            Color Picker
          </button>
          <button
            className={urlState.example === 'form' ? 'active' : ''}
            onClick={() => setUrlState({ example: 'form' })}
          >
            Search form
          </button>
          <button
            className={urlState.example === 'map' ? 'active' : ''}
            onClick={() => setUrlState({ example: 'map' })}
          >
            Map
          </button>
        </div>
        {urlState.example === 'color' && <ColorPicker />}
        {urlState.example === 'form' && <SearchForm />}
        {urlState.example === 'map' && <MapRegion />}
      </>
    )}
  />
)

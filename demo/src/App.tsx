import React, { useState } from 'react'
import { Map, TileLayer } from 'react-leaflet'
import styled, { css, createGlobalStyle } from 'styled-components'
import { hasSucceeded, isLoading, useAsync } from 'with-async'
import { withUrlState, UrlStateProps, UrlState, useUrlState } from './withUrlState'
import 'leaflet/dist/leaflet.css'

const AppStyles = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: sans-serif;
  }

  body, #root {
    align-items: center;
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100vh;
    width: 100%;
    padding: 0;
    margin: 0;
  }
  
  button {
    font-size: 18px;
    padding: 15px 25px;
    margin: 0;
  }
  
  .example-buttons {
    background-color: black;
    display: flex;
    flex-direction: row;
    width: 100%;
  }
  
  .example-buttons button.active {
}
`

const UrlForm = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  width: 100%;
`

const CurrentColorIndicator = styled.div`
  align-items: center;
  color: white;
  display: flex;
  flex-direction: column;
  font-size: 26px;
  height: 100px;
  justify-content: center;
  margin-bottom: 30px;
  text-transform: capitalize;
  width: 250px;
`

const ColorPickerButton = styled.button<{ active: boolean }>`
  background-color: white;
  border: 3px solid purple;
  border-radius: 4px;
  color: purple;
  font-size: 18px;
  margin: 0;
  padding: 15px 30px;

  ${props =>
    props.active &&
    css`
      background-color: purple;
      color: white;
    `}
`

const ColorButtons = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  > * {
    margin-left: 10px;
    margin-right: 10px;
  }
`

export const ColorPicker = () => {
  const [{ color }, setUrlState] = useUrlState({ color: 'red' })
  return (
    <UrlForm style={{ backgroundColor: color }}>
      <CurrentColorIndicator>
        <div>{color}</div>
      </CurrentColorIndicator>
      <ColorButtons>
        <ColorPickerButton
          active={color === 'red'}
          children="Red"
          onClick={() => setUrlState({ color: 'red' })}
        />
        <ColorPickerButton
          active={color === 'green'}
          children="Green"
          onClick={() => setUrlState({ color: 'green' })}
        />
        <ColorPickerButton
          active={color === 'blue'}
          children="Blue"
          onClick={() => setUrlState({ color: 'blue' })}
        />
      </ColorButtons>
    </UrlForm>
  )
}

type MapState = { lat: string; lng: string; zoom: string }
export const MapRegion = () => {
  const [urlState, setUrlState] = useUrlState<MapState>({
    lat: '51.45999681055091',
    lng: '-2.583847045898438',
    zoom: '12',
  })
  return (
    <Map
      center={{ lat: Number(urlState.lat), lng: Number(urlState.lng) }}
      onViewportChanged={({ center: [lat, lng], zoom }: any) =>
        setUrlState({ lat, lng, zoom })
      }
      style={{
        height: '100%',
        width: '100%',
        zIndex: 1,
      }}
      zoom={Number(urlState.zoom)}
    >
      <TileLayer
        attribution={`&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors`}
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </Map>
  )
}

const SearchInput = styled.input`
  margin-bottom: 15px;
  margin-top: 25px;
  padding: 15px 20px;
`

type SearchResults = {
  count: number
  results: Array<{
    height: string
    name: string
    url: string
  }>
}

const characterSearch = (name: string): Promise<SearchResults> =>
  fetch(`https://swapi.co/api/people/?search=${name}`).then(r => r.json())

type FormState = { name: string }
export const SearchForm = () => {
  const [{ name }, setUrlState] = useUrlState<FormState>({ name: 'Skywalker' })
  const asyncState = useAsync(() => characterSearch(name), [name])
  return (
    <div>
      <SearchInput
        placeholder="Search"
        onChange={e => setUrlState({ name: e.target.value })}
        style={{
          marginBottom: 20,
        }}
        value={name}
      />
      <div>
        {isLoading(asyncState) && <p>Loading</p>}
        {hasSucceeded(asyncState) &&
          asyncState.result != null &&
          asyncState.result.results.map(character => (
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
    </div>
  )
}

const NavButton = styled.button<{ active: boolean }>`
  background-color: black;
  border: none;
  color: white;

  ${props =>
    props.active &&
    css`
      color: orange;
    `}
`

const GithubForkBanner = styled.img.attrs({
  alt: 'Fork me on GitHub',
  src: 'https://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png',
})`
  position: absolute;
  top: 0;
  right: 0;
  border: 0;
  z-index: 2;
`

type ExampleState = 'color' | 'form' | 'map'
export const App = () => {
  const [{ active }, setUrlState] = useUrlState<{ active: ExampleState }>({
    active: 'color',
  })
  return (
    <>
      <AppStyles />
      <a href="https://github.com/Dean177/with-url-state">
        <GithubForkBanner />
      </a>
      <div className="example-buttons">
        <NavButton
          active={active === 'color'}
          onClick={() => setUrlState({ active: 'color' })}
        >
          Color Picker
        </NavButton>
        <NavButton
          active={active === 'form'}
          onClick={() => setUrlState({ active: 'form' })}
        >
          Search form
        </NavButton>
        <NavButton
          active={active === 'map'}
          onClick={() => setUrlState({ active: 'map' })}
        >
          Map
        </NavButton>
      </div>
      {active === 'color' && <ColorPicker />}
      {active === 'form' && <SearchForm />}
      {active === 'map' && <MapRegion />}
    </>
  )
}

import React, { useEffect, useRef, useState } from 'react';
import CitySearch from './CitySearch';
import { AirQuality, CurrentWeather, DailyForecast, Highlights, HourlyForecast } from './Forecast';
import { Icon } from './icons';
import { DEMO_AIR, DEMO_FORECAST } from './demo';
import {
  DEFAULT_CITY, POPULAR_CITIES, clock, getAirQuality, getForecast, isRecentForecast,
  readCached, readLocal, samePlace, writeCache, writeLocal,
} from './weather';
import './App.css';

const starterCities = [DEFAULT_CITY, POPULAR_CITIES[1], POPULAR_CITIES[4]];
const startInDemo = () => new URLSearchParams(window.location.search).get('demo') === '1';

function useWeather(city, refresh, demo) {
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    if (demo) return;
    const controller = new AbortController();
    const cached = readCached(city);
    setSnapshot(previous => ({
      id: city.id, forecast: previous?.id === city.id && isRecentForecast(previous.forecast) ? previous.forecast : cached,
      air: null, loading: true, airLoading: true, error: false,
    }));

    getForecast(city, controller.signal).then(forecast => {
      if (controller.signal.aborted) return;
      writeCache(city, forecast);
      setSnapshot(previous => ({ ...previous, forecast, loading: false, error: false }));
    }).catch(() => {
      if (!controller.signal.aborted) setSnapshot(previous => ({ ...previous, loading: false, error: true }));
    });

    getAirQuality(city, controller.signal).then(air => {
      if (!controller.signal.aborted) setSnapshot(previous => ({ ...previous, air, airLoading: false }));
    }).catch(() => {
      if (!controller.signal.aborted) setSnapshot(previous => ({ ...previous, airLoading: false }));
    });

    return () => controller.abort();
  }, [city, refresh, demo]);

  if (demo) return { forecast: DEMO_FORECAST, air: DEMO_AIR, sample: true };
  const current = snapshot?.id === city.id ? snapshot : { loading: true };
  if (!current.forecast && samePlace(city, DEFAULT_CITY)) {
    return { ...current, forecast: DEMO_FORECAST, air: DEMO_AIR, airLoading: false, sample: true };
  }
  return current;
}

export default function App() {
  const [demo, setDemo] = useState(startInDemo);
  const [city, setCity] = useState(() => startInDemo() ? DEFAULT_CITY : readLocal('last-city', DEFAULT_CITY));
  const [favorites, setFavorites] = useState(() => readLocal('favorites', starterCities));
  const [unit, setUnit] = useState(() => readLocal('unit', 'C') === 'F' ? 'F' : 'C');
  const [day, setDay] = useState(0);
  const [mode, setMode] = useState('temp');
  const [refresh, setRefresh] = useState(0);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const locationAttempt = useRef(0);
  const searchInput = useRef(null);
  const data = useWeather(city, refresh, demo);
  const favorite = favorites.some(saved => samePlace(saved, city));

  function exitDemo() {
    if (!demo) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('demo');
    window.history.replaceState(null, '', url);
    setDemo(false);
  }

  function selectCity(next) {
    locationAttempt.current += 1;
    setLocating(false);
    setLocationMessage('');
    exitDemo();
    if (!next.device) writeLocal('last-city', next);
    if (!samePlace(city, next)) {
      setCity(next);
      setDay(0);
    }
  }

  function locate() {
    if (!navigator.geolocation || !window.isSecureContext) {
      setLocationMessage('Device location needs a secure browser connection. You can still search for your city.');
      return;
    }
    const attempt = ++locationAttempt.current;
    setLocating(true);
    setLocationMessage('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (attempt !== locationAttempt.current) return;
        const latitude = Number(coords.latitude.toFixed(2));
        const longitude = Number(coords.longitude.toFixed(2));
        selectCity({ id: `device-${latitude}-${longitude}`, name: 'Your location', latitude, longitude, device: true });
      },
      error => {
        if (attempt !== locationAttempt.current) return;
        setLocating(false);
        setLocationMessage(error.code === 1
          ? 'Location permission was denied. Enable it in your browser or search for a city.'
          : 'Your location could not be determined. Try again or search for a city.');
      },
      { timeout: 9000, maximumAge: 120000 },
    );
  }

  function toggleFavorite() {
    const next = favorite ? favorites.filter(saved => !samePlace(saved, city)) : [...favorites, city];
    setFavorites(next);
    writeLocal('favorites', next);
  }

  function changeUnit(next) {
    setUnit(next);
    writeLocal('unit', next);
  }

  function selectDay(next) {
    setDay(next);
    const section = document.getElementById('hourly-title')?.closest('section');
    if (section && section.getBoundingClientRect().top > window.innerHeight * 0.63) {
      section.scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      });
    }
  }

  const label = data.sample ? 'Sample data' : data.loading ? 'Updating forecast' : data.error && data.forecast ? 'Saved forecast' : data.error ? 'Forecast unavailable' : 'Live forecast';
  const status = data.sample ? 'sample' : data.loading ? 'updating' : data.error ? 'unavailable' : 'live';
  const forecast = data.forecast;

  return (
    <div className="app-shell">
      <a href="#forecast" className="skip-link">Skip to forecast</a>
      <header className="app-header">
        <div className="header-inner">
          <a className="wordmark" href={demo ? './?demo=1' : './'} aria-label="Strata Weather home">
            <span className="brand-mark"><Icon name="logo" size={25} /></span>
            <span>Strata</span>
          </a>
          <CitySearch onSelect={selectCity} controlRef={searchInput} />
          <div className="header-actions">
            <button type="button" className="location-button" onClick={locate} disabled={locating} aria-label="Use my location">
              <Icon name="locate" size={18} /><span>{locating ? 'Locating…' : 'My location'}</span>
            </button>
            <div className="segmented units" role="group" aria-label="Measurement units">
              <button type="button" aria-label="Celsius and metric" aria-pressed={unit === 'C'} onClick={() => changeUnit('C')}>°C</button>
              <button type="button" aria-label="Fahrenheit and imperial" aria-pressed={unit === 'F'} onClick={() => changeUnit('F')}>°F</button>
            </div>
          </div>
        </div>
      </header>

      <main id="forecast">
        {forecast ? (
          <CurrentWeather city={city} forecast={forecast} unit={unit} favorite={favorite} onFavorite={toggleFavorite} />
        ) : (
          <section className="forecast-placeholder" aria-live="polite">
            <div className="page-content placeholder-content">
              <Icon name={data.loading ? 'clock' : 'logo'} size={26} />
              <h1>{data.loading ? `Loading ${city.name}` : `Forecast unavailable for ${city.name}`}</h1>
              <p>{data.loading ? 'Fetching the latest weather model.' : 'Try again or choose another city.'}</p>
              {data.error && <button type="button" className="primary-button" onClick={() => setRefresh(value => value + 1)}>Try again</button>}
            </div>
          </section>
        )}
        <div className="page-content">
          <div className="workspace-bar">
            <div className="saved-cities" aria-label="Saved cities">
              <span className="saved-heading"><Icon name="star" size={15} /> Saved cities</span>
              {favorites.map(saved => (
                <button key={saved.id} type="button" className="city-chip" aria-pressed={samePlace(saved, city)} onClick={() => selectCity(saved)}>
                  {saved.name}
                </button>
              ))}
              <button type="button" className="icon-button add-city" aria-label="Find a city to save" onClick={() => searchInput.current?.focus()}><Icon name="add" size={16} /></button>
            </div>
            <div className="forecast-status">
              <span className={`status-chip status-${status}`} role="status"><i />{label}</span>
              <button type="button" className="icon-button refresh-button" aria-label={demo ? 'Load live forecast' : 'Refresh forecast'}
                onClick={() => { exitDemo(); setRefresh(value => value + 1); }} disabled={data.loading}>
                <Icon name="refresh" size={17} />
              </button>
            </div>
          </div>

          {locationMessage && (
            <div className="notice" role="status"><Icon name="locate" size={17} /><p>{locationMessage}</p>
              <button type="button" className="icon-button" aria-label="Dismiss location message" onClick={() => setLocationMessage('')}><Icon name="close" size={16} /></button>
            </div>
          )}
          {data.error && forecast && !data.sample && (
            <div className="notice" role="status">
              <Icon name="clock" size={17} /><p>Live updates are unavailable. Forecast saved at {clock(forecast.fetchedAt / 1000, forecast.timezone)} local.</p>
            </div>
          )}
          {forecast && (
            <>
              <DailyForecast forecast={forecast} unit={unit} selected={day} onSelect={selectDay} />
              <HourlyForecast key={`${city.id}-${day}-${data.sample ? 'sample' : 'live'}`}
                forecast={forecast} day={day} unit={unit} mode={mode} setMode={setMode} />
              <div className="conditions-grid">
                <Highlights forecast={forecast} unit={unit} />
                <AirQuality air={data.air} loading={data.airLoading} timezone={forecast.timezone} />
              </div>
            </>
          )}

          <footer className="app-footer">
            <span className="footer-brand"><Icon name="logo" size={19} /> Strata Weather</span>
            <p>{data.sample ? 'Illustrative weather and air quality readings.' : 'Forecast times are local to the selected location.'}</p>
            <div className="attribution">
              <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo <Icon name="arrowOut" size={12} /></a>
              <a href="https://atmosphere.copernicus.eu/" target="_blank" rel="noreferrer">CAMS <Icon name="arrowOut" size={12} /></a>
              <a href="https://www.geonames.org/" target="_blank" rel="noreferrer">GeoNames <Icon name="arrowOut" size={12} /></a>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

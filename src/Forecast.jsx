import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Icon, WeatherGlyph } from './icons';
import {
  aqiBand, clock, condition, direction, distance, measure, placeLabel, pressure, rainfall,
  relevantHours, temperature, uvBand, windSpeed,
} from './weather';

function Daylight({ sunrise, sunset, time, timezone }) {
  if (![sunrise, sunset, time].every(Number.isFinite) || sunset <= sunrise) return null;
  const duration = sunset - sunrise;
  const minutes = Math.round(duration / 60);
  const progress = (time - sunrise) / duration;
  const onArc = progress >= 0 && progress <= 1;
  const angle = Math.PI * (1 - progress);
  const sunX = 124 + 108 * Math.cos(angle);
  const sunY = 75 - 60 * Math.sin(angle);
  const path = 'M 16,75 A 108,60 0 0 1 232,75';

  return (
    <figure className="daylight">
      <figcaption><span>Daylight</span><strong>{Math.floor(minutes / 60)}h {minutes % 60}m</strong></figcaption>
      <svg viewBox="0 0 248 83" aria-hidden="true">
        <path className="daylight-horizon" d="M 0,75 H 248" />
        <path className="daylight-orbit" d={path} pathLength="1" />
        {onArc && (
          <g>
            <path className="daylight-elapsed" d={`M 16,75 A 108,60 0 0 1 ${sunX},${sunY}`} />
            <circle className="daylight-halo" cx={sunX} cy={sunY} r="9" />
            <circle className="daylight-sun" cx={sunX} cy={sunY} r="3.7" />
          </g>
        )}
      </svg>
      <div className="daylight-times">
        <span><b>{clock(sunrise, timezone)}</b>Sunrise</span>
        <span><b>{clock(sunset, timezone)}</b>Sunset</span>
      </div>
    </figure>
  );
}

export function CurrentWeather({ city, forecast, unit, favorite, onFavorite }) {
  const { current, daily, timezone } = forecast;
  const now = condition(current.weather_code, current.is_day);
  return (
    <section className={`current-weather sky-${now.palette}`} aria-labelledby="city-heading">
      <div className="sky-art" aria-hidden="true" />
      <div className="hero-content page-content">
        <div className="hero-reading">
          <div className="hero-location">
            <div className="hero-place">
              <span><Icon name="pin" size={14} /> {placeLabel(city) || 'Current conditions'}</span>
              {!city.device && <button type="button" className="icon-button favorite-button" onClick={onFavorite}
                aria-label={favorite ? `Remove ${city.name} from saved cities` : `Save ${city.name}`} aria-pressed={favorite}>
                <Icon name="star" size={16} />
              </button>}
            </div>
            <h1 id="city-heading">{city.name}</h1>
          </div>
          <p className="hero-temp" aria-label={temperature(current.temperature_2m, unit, true)}>
            {temperature(current.temperature_2m, unit).replace('°', '')}<span className="hero-unit">°<small>{unit}</small></span>
          </p>
          <div className="hero-metrics">
            <p className="hero-condition"><WeatherGlyph name={now.icon} size={28} /> {now.label}</p>
            <span>Feels like <strong>{temperature(current.apparent_temperature, unit)}</strong></span>
            <span><Icon name="up" size={15} /> <span className="sr-only">High</span><strong>{temperature(daily[0].temperature_2m_max, unit)}</strong></span>
            <span><Icon name="down" size={15} /> <span className="sr-only">Low</span><strong>{temperature(daily[0].temperature_2m_min, unit)}</strong></span>
          </div>
        </div>
        <div className="hero-observation">
          <p className="hero-date">{clock(current.time, timezone, { weekday: 'long', month: 'short', day: 'numeric' })}<span>{clock(current.time, timezone)} local</span></p>
          <Daylight sunrise={daily[0].sunrise} sunset={daily[0].sunset} time={current.time} timezone={timezone} />
        </div>
      </div>
    </section>
  );
}

function PanelHeading({ title, id, children, subtitle }) {
  return (
    <div className="panel-heading">
      <div className="panel-title">
        <h2 id={id}>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function dayBounds(days) {
  const temperatures = days.flatMap(day => [day.temperature_2m_min, day.temperature_2m_max]).filter(Number.isFinite);
  return temperatures.length ? [Math.min(...temperatures), Math.max(...temperatures)] : [0, 0];
}

export function DailyForecast({ forecast, unit, selected, onSelect }) {
  const { daily, timezone } = forecast;
  const [weekLow, weekHigh] = dayBounds(daily);
  const weekSpan = weekHigh - weekLow || 1;
  const selectedDay = daily[selected];
  return (
    <section className="panel daily-panel" aria-labelledby="daily-title">
      <PanelHeading title="The week ahead" id="daily-title" subtitle="7-day forecast · Select a day for its hourly outlook" />
      <ul className="daily-list">
        {daily.map((day, index) => {
          const sky = condition(day.weather_code);
          const low = day.temperature_2m_min;
          const high = day.temperature_2m_max;
          const hasRange = Number.isFinite(low) && Number.isFinite(high);
          const label = index === 0 ? 'Today' : clock(day.time, timezone, { weekday: 'short' });
          return (
            <li key={day.time}>
              <button type="button" aria-pressed={index === selected} className="daily-row" onClick={() => onSelect(index)}
                aria-label={`${label}, ${sky.label}, low ${temperature(low, unit, true)}, high ${temperature(high, unit, true)}, precipitation ${measure(day.precipitation_probability_max, '%')}`}>
                <span className="day-name">{label}</span>
                <span className="day-weather" title={sky.label}><WeatherGlyph name={sky.icon} size={30} /></span>
                <span className="day-temps">
                  <strong>{temperature(high, unit)}</strong><span>{temperature(low, unit)}</span>
                </span>
                <span className="day-range" aria-hidden="true">
                  {hasRange && <span style={{ left: `${(low - weekLow) / weekSpan * 100}%`, width: `${(high - low) / weekSpan * 100}%` }} />}
                </span>
                <span className="day-rain"><Icon name="drop" size={13} /> {measure(day.precipitation_probability_max, '%')}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="daily-footer">
        <span><Icon name="drop" size={14} /> Precipitation chance</span>
        <span>{selected === 0 ? 'Today' : clock(selectedDay.time, timezone, { weekday: 'short' })} · {rainfall(selectedDay.precipitation_sum, unit)} expected</span>
      </div>
    </section>
  );
}

const columnWidth = 76;
const chartHeight = 114;

function TrendLine({ values, active, mode }) {
  const gradient = useId();
  const available = values.filter(Number.isFinite);
  const low = mode === 'rain' ? 0 : Math.min(...available) - 2;
  const high = mode === 'rain' ? 100 : Math.max(...available) + 2;
  const width = columnWidth * values.length;
  const segments = values.reduce((parts, value, index) => {
    if (!Number.isFinite(value)) return index > 0 && parts.at(-1)?.length ? [...parts, []] : parts;
    const x = (index + 0.5) * columnWidth;
    const y = 7 + (chartHeight - 14) * (1 - (value - low) / (high - low));
    parts.at(-1).push({ x, y, index });
    return parts;
  }, [[]]).filter(part => part.length);
  return (
    <svg className={`trend-line trend-${mode}`} viewBox={`0 0 ${width} ${chartHeight}`} width={width} height={chartHeight}
      aria-hidden="true">
      <defs>
        <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="currentColor" stopOpacity=".31" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[21, 65, 108].map(y => <line key={y} className="chart-rule" x1="0" x2={width} y1={y} y2={y} />)}
      {segments.map(segment => {
        const line = segment.map(point => `${point.x},${point.y}`).join(' ');
        return (
          <g key={segment[0].index}>
            {segment.length > 1 && <>
              <polygon points={`${segment[0].x},${chartHeight} ${line} ${segment.at(-1).x},${chartHeight}`} fill={`url(#${gradient})`} />
              <polyline points={line} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" />
            </>}
            {segment.map(({ x, y, index }) => <circle key={index} cx={x} cy={y} r={index === active ? 4.7 : 2.8}
              fill="currentColor" stroke="var(--panel)" strokeWidth="1.4" />)}
          </g>
        );
      })}
    </svg>
  );
}

export function HourlyForecast({ forecast, day, unit, mode, setMode }) {
  const hours = useMemo(() => relevantHours(forecast, day), [forecast, day]);
  const scroller = useRef(null);
  const [active, setActive] = useState(0);
  const [edges, setEdges] = useState({ left: false, right: false });
  const { timezone, current } = forecast;
  const values = hours.map(hour => mode === 'rain' ? hour.precipitation_probability : hour.temperature_2m);
  const hour = hours[active] ?? hours[0];
  const showNow = day === 0 && hour === hours[0] && hour?.time <= current.time;
  const title = day === 0 ? 'Next 24 hours' : clock(forecast.daily[day].time, timezone, { weekday: 'long', month: 'short', day: 'numeric' });

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    function update() {
      setEdges({ left: element.scrollLeft > 1, right: element.scrollLeft + element.clientWidth < element.scrollWidth - 1 });
    }
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener('scroll', update, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', update);
    };
  }, [hours.length]);

  function shift(step) {
    const element = scroller.current;
    if (!element) return;
    const size = Math.max(columnWidth, Math.floor(element.clientWidth / columnWidth - 1) * columnWidth);
    element.scrollBy({ left: size * step, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  return (
    <section className="panel hourly-panel" aria-labelledby="hourly-title">
      <PanelHeading title="Hour by hour" id="hourly-title" subtitle={title}>
        <div className="segmented chart-modes" role="group" aria-label="Hourly chart metric">
          <button type="button" aria-pressed={mode === 'temp'} onClick={() => setMode('temp')}>Temp</button>
          <button type="button" aria-pressed={mode === 'rain'} onClick={() => setMode('rain')}>Precip.</button>
        </div>
      </PanelHeading>
      {hours.length ? (
        <>
          <div className="hourly-scroll" ref={scroller}>
            <div className="hourly-track" style={{ width: hours.length * columnWidth }}>
              <TrendLine values={values} active={active} mode={mode} />
              <ol className="hourly-points">
                {hours.map((point, index) => {
                  const sky = condition(point.weather_code, point.is_day);
                  const time = day === 0 && index === 0 && point.time <= current.time ? 'Now' : clock(point.time, timezone);
                  const value = mode === 'rain' ? measure(point.precipitation_probability, '%') : temperature(point.temperature_2m, unit);
                  return (
                    <li key={point.time}>
                      <button type="button" className="hour-point" aria-pressed={index === active} onClick={() => setActive(index)}
                        aria-label={`${time}, ${sky.label}, ${mode === 'rain' ? 'precipitation chance ' : 'temperature '}${value}`}>
                        <span>{time}</span><WeatherGlyph name={sky.icon} size={22} /><strong>{value}</strong>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
          <div className="hourly-footer">
            <p aria-live="polite">
              <strong>{showNow ? 'Now' : clock(hour.time, timezone)}</strong>
              <span>{condition(hour.weather_code, hour.is_day).label}</span>
              <span><Icon name="drop" size={13} /> {measure(hour.precipitation_probability, '%')} precip.</span>
            </p>
            <div className="hourly-nav">
              <button className="icon-button" aria-label="Scroll to earlier hours" onClick={() => shift(-1)} disabled={!edges.left}><Icon name="left" size={16} /></button>
              <button className="icon-button" aria-label="Scroll to later hours" onClick={() => shift(1)} disabled={!edges.right}><Icon name="right" size={16} /></button>
            </div>
          </div>
        </>
      ) : <p className="panel-empty">Hourly data is unavailable for this day.</p>}
    </section>
  );
}

export function AirQuality({ air, loading, timezone }) {
  const band = aqiBand(air?.us_aqi);
  const ranges = [0, 50, 100, 150, 200, 300, 500];
  const segment = ranges.slice(1).findIndex(limit => air?.us_aqi <= limit);
  const position = segment < 0 ? 100 : 100 / 6 * (segment + (Math.max(0, air.us_aqi) - ranges[segment]) / (ranges[segment + 1] - ranges[segment]));
  return (
    <section className="panel air-panel" aria-labelledby="air-title">
      <PanelHeading title="Air quality" subtitle="US AQI · Model estimate" id="air-title" />
      {band ? (
        <>
          <div className="air-reading">
            <strong>{measure(air.us_aqi)}</strong><span style={{ color: band.color }}><span />{band.label}</span>
          </div>
          <div className="air-scale" aria-hidden="true">
            {ranges.slice(1).map(limit => <i key={limit} style={{ background: aqiBand(limit).color }} />)}
            <span className="air-marker" style={{ '--marker': `${position}%` }} />
          </div>
          <div className="air-scale-labels"><span>Good</span><span>Hazardous</span></div>
          <dl className="pollutants">
            <div><dt>PM₂.₅</dt><dd>{measure(air.pm2_5, ' µg/m³', 1)}</dd></div>
            <div><dt>PM₁₀</dt><dd>{measure(air.pm10, ' µg/m³', 1)}</dd></div>
          </dl>
          {Number.isFinite(air.time) && <p className="air-time">Model time {clock(air.time, timezone)} local</p>}
        </>
      ) : <p className="panel-empty">{loading ? 'Loading air quality…' : 'Air quality readings are unavailable for this forecast.'}</p>}
    </section>
  );
}

export function Highlights({ forecast, unit }) {
  const { current, timezone, daily } = forecast;
  const [hour] = relevantHours(forecast, 0);
  const today = daily[0];
  const cards = [
    { icon: 'wind', title: 'Wind', value: windSpeed(current.wind_speed_10m, unit), note: [direction(current.wind_direction_10m), `Gusts ${windSpeed(current.wind_gusts_10m, unit)}`].filter(Boolean).join(' · ') },
    { icon: 'humidity', title: 'Humidity', value: measure(current.relative_humidity_2m, '%'), note: 'Relative humidity' },
    { icon: 'sun', title: 'UV index', value: measure(hour?.uv_index, '', 1), note: uvBand(hour?.uv_index) || 'Hourly reading unavailable' },
    { icon: 'eye', title: 'Visibility', value: distance(hour?.visibility, unit), note: 'Hourly estimate' },
    { icon: 'gauge', title: 'Pressure', value: pressure(current.pressure_msl, unit), note: 'At sea level' },
    { icon: 'drop', title: 'Precipitation', value: measure(today.precipitation_probability_max, '%'), note: `${rainfall(today.precipitation_sum, unit)} expected today` },
  ];
  return (
    <section className="highlights" aria-labelledby="highlights-title">
      <h2 id="highlights-title">Today’s conditions</h2>
      <div className="highlight-grid">
        {cards.map(card => (
          <article className="panel detail-card" key={card.title}>
            <div className="detail-title">
              {card.icon === 'sun' ? <WeatherGlyph name="sun" size={18} /> : <Icon name={card.icon} size={18} />}
              <h3>{card.title}</h3>
            </div>
            <p>{card.value}</p>
            <small>{card.note}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

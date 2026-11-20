import React from 'react';

const paths = {
  logo: <><path d="M4.2 14a4 4 0 0 1 2.5-6.3 5.6 5.6 0 0 1 10.7 1.6h.7a3.8 3.8 0 0 1 1.8 7.1"/><path d="M2.5 17h13m-9 3h11"/></>,
  search: <><circle cx="10.8" cy="10.8" r="5.8"/><path d="m15 15 4 4"/></>,
  locate: <><circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="2.3"/><path d="M12 2v3.5M12 18.5V22M2 12h3.5m13 0H22"/></>,
  pin: <><path d="M19 10c0 6-7 10-7 10s-7-4-7-10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.2"/></>,
  star: <path d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.1 6.1-5.3-3-5.3 3 1.1-6.1-4.5-4.2 6.1-.8L12 3Z"/>,
  clock: <><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></>,
  calendar: <><rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 4v4m8-4v4M4 10h16m-12 4h2m4 0h2m-8 3h2"/></>,
  left: <path d="m14 7-5 5 5 5"/>,
  right: <path d="m10 7 5 5-5 5"/>,
  up: <path d="M12 19V5m-5 5 5-5 5 5"/>,
  down: <path d="M12 5v14m-5-5 5 5 5-5"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  refresh: <><path d="M19.5 10a7.5 7.5 0 0 0-12.7-4L4 9m0 0V4m0 5h5"/><path d="M4.5 14a7.5 7.5 0 0 0 12.7 4l2.8-3m0 0v5m0-5h-5"/></>,
  add: <path d="M12 5v14M5 12h14"/>,
  drop: <path d="M12 3C10 6 6 10.5 6 14a6 6 0 0 0 12 0c0-3.5-4-8-6-11Z"/>,
  humidity: <><path d="M12 3C10 6 6 10.5 6 14a6 6 0 0 0 12 0c0-3.5-4-8-6-11Z"/><path d="m9.5 16.5 5-5m-5 0h.01m5 5h.01"/></>,
  wind: <><path d="M3 8h11a2.5 2.5 0 1 0-2.5-2.5M2 12h17a2.5 2.5 0 1 0-2.5-2.5M4 16h9a2.5 2.5 0 1 1-2.5 2.5"/></>,
  eye: <><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></>,
  gauge: <><path d="M4.8 17.5a8.8 8.8 0 1 1 14.4 0"/><path d="m12 13.5 4-4m-9 5h.01m5-8h.01m5 8h.01M9 19h6"/></>,
  horizon: <><path d="M3 17h18M6 20h12m-11-3a5 5 0 0 1 10 0m-5-6V8m-7 5-2-2m16 2 2-2"/></>,
  air: <><path d="M2 8h3l2-3 3 6 3-8 3 10 2-5h4M2 17h20m-16 4h12"/></>,
  arrowOut: <path d="M7 17 17 7M8 7h9v9"/>,
};

export function Icon({ name, size = 20, className, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} {...props}>
    {paths[name]}
  </svg>;
}

const rays = <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>;
const moon = <path d="M20.5 14A8.7 8.7 0 0 1 10 3.5 8.7 8.7 0 1 0 20.5 14Z"/>;
const cloud = <path d="M6.5 17.8a4.4 4.4 0 0 1-.4-8.8 6 6 0 0 1 11.3.9h.6a4 4 0 0 1 0 7.9Z"/>;

export function WeatherGlyph({ name, size = 24 }) {
  const precipitation = ['rain', 'snow', 'fog', 'storm'].includes(name);
  const sunny = {
    sun: <g className="glyph-sun"><circle cx="12" cy="12" r="4.3"/>{rays}</g>,
    moon: <g className="glyph-moon">{moon}</g>,
    partly: <g className="glyph-sun"><circle cx="8.1" cy="8.1" r="3.7"/><path d="M8.1 1.5v1.7M1.5 8.1h1.7m.1-5 1.3 1.4m7.2 0 1.4-1.4"/></g>,
    partlyNight: <g className="glyph-moon" transform="translate(-.5 -1) scale(.66)">{moon}</g>,
  };
  return <svg className="weather-glyph" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {sunny[name]}
    {name !== 'sun' && name !== 'moon' && (
      <g className="glyph-cloud" transform={precipitation ? 'translate(0 -3)' : ['partly', 'partlyNight'].includes(name) ? 'translate(3 5) scale(.86)' : undefined}>
        {cloud}
      </g>
    )}
    {name === 'rain' && <path className="glyph-rain" d="m7 17-1 3m6-3-1 3m6-3-1 3"/>}
    {name === 'snow' && <path className="glyph-rain" d="M6.5 18.5h.01m5.5 2h.01m5.5-2h.01" strokeWidth="2.6"/>}
    {name === 'fog' && <path className="glyph-fog" d="M6 17.5h12M4 21h16"/>}
    {name === 'storm' && <path className="glyph-sun" d="m12 16-2 3h4l-2 3"/>}
  </svg>;
}

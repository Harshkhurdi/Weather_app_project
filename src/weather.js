const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const AIR_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

const currentFields = [
  'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'is_day',
  'weather_code', 'pressure_msl', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
];
const hourlyFields = [
  'temperature_2m', 'apparent_temperature', 'precipitation_probability', 'is_day',
  'weather_code', 'visibility', 'uv_index', 'wind_speed_10m',
];
const dailyFields = [
  'weather_code', 'temperature_2m_max', 'temperature_2m_min',
  'sunrise', 'sunset', 'precipitation_probability_max', 'precipitation_sum', 'wind_speed_10m_max',
];

export const DEFAULT_CITY = { id: 'chandigarh', name: 'Chandigarh', region: 'Chandigarh', country: 'India', code: 'IN', latitude: 30.7333, longitude: 76.7794 };
export const POPULAR_CITIES = [
  DEFAULT_CITY,
  { id: 'mohali', name: 'Mohali', region: 'Punjab', country: 'India', code: 'IN', latitude: 30.7046, longitude: 76.7179 },
  { id: 'delhi', name: 'New Delhi', region: 'Delhi', country: 'India', code: 'IN', latitude: 28.6139, longitude: 77.209 },
  { id: 'mumbai', name: 'Mumbai', region: 'Maharashtra', country: 'India', code: 'IN', latitude: 19.076, longitude: 72.8777 },
  { id: 'london', name: 'London', region: 'England', country: 'United Kingdom', code: 'GB', latitude: 51.5072, longitude: -0.1276 },
  { id: 'new-york', name: 'New York', region: 'New York', country: 'United States', code: 'US', latitude: 40.7128, longitude: -74.006 },
  { id: 'tokyo', name: 'Tokyo', region: 'Tokyo', country: 'Japan', code: 'JP', latitude: 35.6762, longitude: 139.6503 },
];

export function placeLabel(city) {
  if (city.device) return `${Math.abs(city.latitude).toFixed(2)}° ${city.latitude < 0 ? 'S' : 'N'}, ${Math.abs(city.longitude).toFixed(2)}° ${city.longitude < 0 ? 'W' : 'E'}`;
  return [...new Set([city.region, city.country].filter(part => part && part !== city.name))].join(', ');
}

export function samePlace(first, second) {
  return first.id === second.id || (
    !first.device && !second.device && first.code === second.code &&
    first.name.toLowerCase() === second.name.toLowerCase() &&
    Math.abs(first.latitude - second.latitude) < 0.1 && Math.abs(first.longitude - second.longitude) < 0.1
  );
}

export function localMatches(query) {
  const [name, area] = query.trim().toLowerCase().split(',').map(part => part.trim());
  return POPULAR_CITIES.filter(city =>
    city.name.toLowerCase().startsWith(name) &&
    (!area || [city.region, city.country, city.code].some(part => part.toLowerCase() === area)),
  );
}

async function request(endpoint, params, signal) {
  const timeout = AbortSignal.timeout(12000);
  const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`, {
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  if (!response.ok) throw new Error(`Weather service returned ${response.status}`);
  const result = await response.json();
  if (result.error) throw new Error('The weather service rejected this request.');
  return result;
}

export async function findCities(query, signal) {
  const data = await request(GEOCODING_URL, { name: query.trim(), count: 8, language: 'en' }, signal);
  const matches = (data.results ?? []).map(place => {
    const city = {
      id: String(place.id), name: place.name, region: place.admin1 ?? '', country: place.country ?? place.country_code ?? '',
      code: place.country_code, latitude: place.latitude, longitude: place.longitude,
    };
    return POPULAR_CITIES.find(preset => samePlace(preset, city)) ?? city;
  });
  return matches.filter((city, index) => matches.findIndex(match => samePlace(city, match)) === index);
}

const coordinates = city => ({ latitude: city.latitude, longitude: city.longitude });

function unpack(series, fields) {
  return series.time.map((time, index) => ({
    time,
    ...Object.fromEntries(fields.map(field => [field, series[field]?.[index] ?? null])),
  }));
}

export async function getForecast(city, signal) {
  const result = await request(FORECAST_URL, {
    ...coordinates(city), current: currentFields.join(','), hourly: hourlyFields.join(','),
    daily: dailyFields.join(','), timezone: 'auto', timeformat: 'unixtime', forecast_days: 8,
  }, signal);
  if (!Number.isFinite(result.current?.time) || !Number.isFinite(result.current?.temperature_2m) ||
      !result.hourly?.time?.length || (result.daily?.time?.length ?? 0) < 7 || !result.timezone) {
    throw new Error('The weather service returned an incomplete forecast.');
  }

  return {
    current: result.current, timezone: result.timezone,
    hourly: unpack(result.hourly, hourlyFields), daily: unpack(result.daily, dailyFields).slice(0, 7),
    fetchedAt: Date.now(),
  };
}

export async function getAirQuality(city, signal) {
  const result = await request(AIR_URL, {
    ...coordinates(city), current: 'us_aqi,pm2_5,pm10', timeformat: 'unixtime',
  }, signal);
  return Number.isFinite(result.current?.us_aqi) ? result.current : null;
}

export function clock(time, timezone, options = { hour: 'numeric', minute: '2-digit' }) {
  if (!Number.isFinite(time)) return '—';
  return new Intl.DateTimeFormat('en', { timeZone: timezone, ...options }).format(new Date(time * 1000));
}

export function dateKey(time, timezone) {
  return clock(time, timezone, { year: 'numeric', month: '2-digit', day: '2-digit' });
}

const weatherCodes = {
  0: ['Clear sky', 'sun', 'clear'], 1: ['Mostly clear', 'sun', 'clear'],
  2: ['Partly cloudy', 'partly', 'cloud'], 3: ['Overcast', 'cloud', 'cloud'],
  45: ['Fog', 'fog', 'cloud'], 48: ['Freezing fog', 'fog', 'cloud'],
  51: ['Light drizzle', 'rain', 'rain'], 53: ['Drizzle', 'rain', 'rain'], 55: ['Heavy drizzle', 'rain', 'rain'],
  56: ['Freezing drizzle', 'rain', 'rain'], 57: ['Heavy freezing drizzle', 'rain', 'rain'],
  61: ['Light rain', 'rain', 'rain'], 63: ['Rain', 'rain', 'rain'], 65: ['Heavy rain', 'rain', 'rain'],
  66: ['Freezing rain', 'rain', 'rain'], 67: ['Heavy freezing rain', 'rain', 'rain'],
  71: ['Light snow', 'snow', 'snow'], 73: ['Snow', 'snow', 'snow'], 75: ['Heavy snow', 'snow', 'snow'],
  77: ['Snow grains', 'snow', 'snow'], 80: ['Light showers', 'rain', 'rain'], 81: ['Rain showers', 'rain', 'rain'],
  82: ['Heavy showers', 'rain', 'rain'], 85: ['Snow showers', 'snow', 'snow'], 86: ['Heavy snow showers', 'snow', 'snow'],
  95: ['Thunderstorm', 'storm', 'rain'], 96: ['Thunderstorm with hail', 'storm', 'rain'],
  99: ['Thunderstorm with heavy hail', 'storm', 'rain'],
};

export function condition(code, isDay = 1) {
  const [label, icon, palette] = weatherCodes[code] ?? ['Conditions unavailable', 'cloud', 'cloud'];
  const night = isDay === 0;
  return {
    label,
    icon: night && icon === 'sun' ? 'moon' : night && icon === 'partly' ? 'partlyNight' : icon,
    palette: night ? 'night' : palette,
  };
}

const compass = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export function direction(degrees) {
  return Number.isFinite(degrees) ? compass[Math.round(degrees / 45) % 8] : '';
}

export function measure(value, suffix = '', digits = 0) {
  if (!Number.isFinite(value)) return '—';
  return `${Number(value.toFixed(digits))}${suffix}`;
}

export function temperature(value, unit, showUnit = false) {
  if (!Number.isFinite(value)) return '—';
  const adjusted = unit === 'F' ? value * 1.8 + 32 : value;
  return measure(adjusted, showUnit ? `°${unit}` : '°');
}

export function windSpeed(value, unit) {
  if (!Number.isFinite(value)) return '—';
  return unit === 'F' ? measure(value * 0.621371, ' mph') : measure(value, ' km/h');
}

export function distance(value, unit) {
  if (!Number.isFinite(value)) return '—';
  return unit === 'F' ? measure(value / 1609.344, ' mi', 1) : measure(value / 1000, ' km', 1);
}

export function rainfall(value, unit) {
  if (!Number.isFinite(value)) return '—';
  return unit === 'F' ? measure(value / 25.4, ' in', 2) : measure(value, ' mm', 1);
}

export function pressure(value, unit) {
  if (!Number.isFinite(value)) return '—';
  return unit === 'F' ? measure(value * 0.02953, ' inHg', 2) : measure(value, ' hPa');
}

export function aqiBand(value) {
  if (!Number.isFinite(value)) return null;
  if (value <= 50) return { label: 'Good', color: '#7de2ad' };
  if (value <= 100) return { label: 'Moderate', color: '#eed37c' };
  if (value <= 150) return { label: 'Unhealthy for sensitive groups', color: '#ffab77' };
  if (value <= 200) return { label: 'Unhealthy', color: '#fc868b' };
  if (value <= 300) return { label: 'Very unhealthy', color: '#d39aff' };
  return { label: 'Hazardous', color: '#f685b2' };
}

export function uvBand(value) {
  if (!Number.isFinite(value)) return '';
  if (value < 3) return 'Low';
  if (value < 6) return 'Moderate';
  if (value < 8) return 'High';
  if (value < 11) return 'Very high';
  return 'Extreme';
}

export function relevantHours(forecast, selectedDay) {
  if (selectedDay === 0) {
    // Some timezones have half-hour offsets, so use the last model point at or before the current time.
    const next = forecast.hourly.findIndex(point => point.time > forecast.current.time);
    const start = next < 0 ? Math.max(0, forecast.hourly.length - 1) : Math.max(0, next - 1);
    return forecast.hourly.slice(start, start + 24);
  }
  const day = dateKey(forecast.daily[selectedDay].time, forecast.timezone);
  return forecast.hourly.filter(point => dateKey(point.time, forecast.timezone) === day);
}

const storageKey = 'strata-weather:';
export function readLocal(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(storageKey + key)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal(key, value) {
  try {
    localStorage.setItem(storageKey + key, JSON.stringify(value));
  } catch {
    // Weather still works when storage is disabled or full.
  }
}

const cacheLifetime = 12 * 3600 * 1000;
export function isRecentForecast(data) {
  return data && Date.now() - data.fetchedAt < cacheLifetime &&
    dateKey(data.current.time, data.timezone) === dateKey(Date.now() / 1000, data.timezone);
}

export function readCached(city) {
  if (city.device) return null;
  const data = readLocal('forecasts', {})[city.id];
  return isRecentForecast(data) ? data : null;
}

export function writeCache(city, forecast) {
  if (city.device) return;
  const existing = readLocal('forecasts', {});
  const latest = Object.entries({ ...existing, [city.id]: forecast })
    .sort(([, a], [, b]) => b.fetchedAt - a.fetchedAt).slice(0, 8);
  writeLocal('forecasts', Object.fromEntries(latest));
}

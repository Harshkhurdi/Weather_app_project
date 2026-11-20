// Illustrative values for a clearly labelled forecast preview.
const dayStart = Date.parse('2026-11-20T00:00:00+05:30') / 1000;
const hours = [
  16, 16, 15, 15, 14, 14, 15, 16, 18, 20, 22, 24,
  25, 26, 27, 27, 26, 24, 22, 21, 20, 19, 18, 17,
];
const highs = [27, 28, 26, 24, 23, 25, 26, 27];
const lows = [14, 15, 16, 15, 13, 14, 15, 16];
const rain = [10, 6, 24, 78, 55, 15, 8, 10];
const codes = [2, 0, 3, 61, 80, 2, 0, 0];
const currentTime = dayStart + 14 * 3600 + 15 * 60;

export const DEMO_FORECAST = {
  timezone: 'Asia/Kolkata',
  current: {
    time: currentTime, temperature_2m: 27, apparent_temperature: 28, weather_code: 2, is_day: 1,
    relative_humidity_2m: 46, pressure_msl: 1016, wind_speed_10m: 12, wind_direction_10m: 315, wind_gusts_10m: 21,
  },
  daily: highs.slice(0, 7).map((high, day) => ({
    time: dayStart + day * 86400, temperature_2m_max: high, temperature_2m_min: lows[day],
    weather_code: codes[day], sunrise: dayStart + day * 86400 + (405 + day) * 60,
    sunset: dayStart + day * 86400 + (1044 - day) * 60, precipitation_probability_max: rain[day],
    precipitation_sum: day === 3 ? 6.2 : day === 4 ? 2.8 : 0, wind_speed_10m_max: 18 + day,
  })),
  hourly: Array.from({ length: 24 * 8 }, (_, index) => {
    const hour = index % 24;
    const day = Math.floor(index / 24);
    const temperature = Math.round(lows[day] + (hours[hour] - lows[0]) * (highs[day] - lows[day]) / (highs[0] - lows[0]));
    const daylight = hour >= 7 && hour < 18;
    return {
      time: dayStart + index * 3600, temperature_2m: temperature, apparent_temperature: temperature + 1,
      precipitation_probability: Math.max(0, rain[day] - Math.abs(16 - hour) * 2),
      weather_code: codes[day], is_day: Number(daylight), wind_speed_10m: 12 + day,
      visibility: 10200, uv_index: daylight ? Math.max(0, 5 - Math.abs(14 - hour)) : 0,
    };
  }),
};

export const DEMO_AIR = { time: currentTime, us_aqi: 74, pm2_5: 22, pm10: 35 };

# Strata Weather

A responsive React and Vite weather app for current conditions, the next 24 hours, and the next seven days. It uses Open-Meteo directly from the browser and starts in Chandigarh.

Daylight and moonlit sky scenes follow local conditions. The daylight track plots elapsed time from forecast sunrise to sunset.

## Run locally

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. Add `?demo=1` to preview an illustrative forecast without requesting weather data. The refresh button returns to live mode.

```sh
npm run build
npm run preview
```

Deploy the generated `dist/` directory to a static host. Device location requires HTTPS or localhost and browser permission.

## Using the forecast

- Search for a city or postcode. Add a country or region after a comma to disambiguate a city.
- Select a day in the seven-day outlook to explore that day by hour. Switch the chart between temperature and precipitation chance.
- Star a city to save it. The app stores saved cities, the last selected city, and measurement units in browser storage.
- The app can show a recently saved forecast when the weather service is unreachable. The status above the forecast identifies live, saved, and sample data.
- Device location is requested on demand. Approximate coordinates are sent to the weather provider and kept in the active session.

Forecast and geocoding data are provided by [Open-Meteo](https://open-meteo.com/). Geocoding incorporates [GeoNames](https://www.geonames.org/). Air quality is a [CAMS](https://atmosphere.copernicus.eu/) model estimate presented on the US AQI scale. Review [Open-Meteo’s usage terms](https://open-meteo.com/en/terms) before commercial deployment.

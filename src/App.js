import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from "react-leaflet";
import L from "leaflet";
import Papa from "papaparse";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Simple function to map Open-Meteo weathercode to one-word description
const weatherCodeMap = {
  0: "Clear",
  1: "MainlyClear",
  2: "PartlyCloudy",
  3: "Overcast",
  45: "Fog",
  48: "DepositingFog",
  51: "Drizzle",
  53: "Drizzle",
  55: "Drizzle",
  56: "FreezingDrizzle",
  57: "FreezingDrizzle",
  61: "Rain",
  63: "Rain",
  65: "Rain",
  66: "FreezingRain",
  67: "FreezingRain",
  71: "Snow",
  73: "Snow",
  75: "Snow",
  77: "SnowGrains",
  80: "RainShowers",
  81: "RainShowers",
  82: "RainShowers",
  85: "SnowShowers",
  86: "SnowShowers",
  95: "Thunderstorm",
  96: "ThunderstormHail",
  99: "ThunderstormHail",
};

function App() {
  const [cities, setCities] = useState([]);
  const [weatherData, setWeatherData] = useState({});

  // Load CSV from public folder
  useEffect(() => {
    fetch("/data/cities.csv")
      .then((res) => res.text())
      .then((csvText) => {
        const { data } = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        const parsed = data
          .filter(row => row.city && row.latitude && row.longitude)
          .map(row => ({
            city: row.city,
            date: row.date,
            lat: parseFloat(row.latitude),
            lon: parseFloat(row.longitude),
          }));
        setCities(parsed);
      });
  }, []);

  // Fetch weather for each city from Open-Meteo
  useEffect(() => {
    if (cities.length === 0) return;

    cities.forEach(async (city) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.current_weather) {
          setWeatherData(prev => ({
            ...prev,
            [city.city]: {
              temp: data.current_weather.temperature,
              desc: weatherCodeMap[data.current_weather.weathercode] || "Unknown"
            }
          }));
        }
      } catch (err) {
        console.error("Weather fetch error for", city.city, err);
        setWeatherData(prev => ({
          ...prev,
          [city.city]: { temp: "N/A", desc: "N/A" }
        }));
      }
    });
  }, [cities]);

  const polylineCoords = cities.map(c => [c.lat, c.lon]);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer center={[62, 25]} zoom={5} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
        />

        <Polyline positions={polylineCoords} color="blue" weight={2} />

        {cities.map((city, idx) => (
          <Marker key={idx} position={[city.lat, city.lon]}>
            <Tooltip permanent direction="right" offset={[10, 0]}>
              <div style={{ fontSize: "10px" }}>
                <strong>{city.city}</strong> ({city.date})<br />
                {weatherData[city.city]
                  ? `${weatherData[city.city].temp}°C, ${weatherData[city.city].desc}`
                  : "Loading..."}
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default App;
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from "react-leaflet";
import L from "leaflet";
import Papa from "papaparse";
import "leaflet/dist/leaflet.css";

// Create a smaller marker icon (half size)
const smallIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [12, 20],       // half of default 25x41
  iconAnchor: [6, 20],      // bottom of icon is the marker point
  popupAnchor: [0, -20],    
  shadowSize: [20, 20],
});

// Weather code to readable description
const weatherCodeMap = {
  0: "Clear",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing Fog",
  51: "Drizzle",
  53: "Drizzle",
  55: "Drizzle",
  56: "Freezing Drizzle",
  57: "Freezing Drizzle",
  61: "Rain",
  63: "Rain",
  65: "Rain",
  66: "Freezing Rain",
  67: "Freezing Rain",
  71: "Snow",
  73: "Snow",
  75: "Snow",
  77: "Snow Grains",
  80: "Rain Showers",
  81: "Rain Showers",
  82: "Rain Showers",
  85: "Snow Showers",
  86: "Snow Showers",
  95: "Thunderstorm",
  96: "Thunderstorm with Hail",
  99: "Thunderstorm with Hail",
};

function App() {
  const [cities, setCities] = useState([]);
  const [weatherData, setWeatherData] = useState({});
  const [showTooltips, setShowTooltips] = useState(true);

  // Load CSV
  useEffect(() => {
    fetch("/data/cities.csv")
      .then(res => res.text())
      .then(csvText => {
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

  // Fetch weather from Open-Meteo
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
              desc: weatherCodeMap[data.current_weather.weathercode] || "Unknown",
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
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <MapContainer center={[62, 25]} zoom={5} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
        />

        <Polyline positions={polylineCoords} color="blue" weight={2} />

        {cities.map((city, idx) => (
          <Marker key={idx} position={[city.lat, city.lon]} icon={smallIcon}>
            {showTooltips && (
              <Tooltip permanent direction="right" offset={[10, 0]}>
                <div style={{ fontSize: "10px" }}>
                  <strong>{city.city}</strong> ({city.date})<br />
                  {weatherData[city.city]
                    ? `${weatherData[city.city].temp}°C, ${weatherData[city.city].desc}`
                    : "Loading..."}
                </div>
              </Tooltip>
            )}
          </Marker>
        ))}
      </MapContainer>

      {/* Tooltip toggle switch */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "white",
          padding: "6px 12px",
          borderRadius: "8px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          cursor: "pointer",
          userSelect: "none",
          zIndex: 1000,
        }}
        onClick={() => setShowTooltips(prev => !prev)}
      >
        {showTooltips ? "Hide Tooltips" : "Show Tooltips"}
      </div>
    </div>
  );
}

export default App;
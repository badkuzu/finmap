import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from "react-leaflet";
import L from "leaflet";
import Papa from "papaparse";
import "leaflet/dist/leaflet.css";

// Half-size marker icon (optional: use circus tent if you like)
const smallIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [12, 20],       
  iconAnchor: [6, 20],      
  popupAnchor: [0, -20],    
  shadowSize: [20, 20],
});

function App() {
  const [cities, setCities] = useState([]);
  const [weatherData, setWeatherData] = useState({});
  const [showTooltips, setShowTooltips] = useState(true);

  const WEATHERAPI_KEY = process.env.REACT_APP_WEATHERAPI_KEY;

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

  // Fetch weather for each city from WeatherAPI.com
  useEffect(() => {
    if (cities.length === 0) return;

    cities.forEach(async (city) => {
      try {
        const res = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${WEATHERAPI_KEY}&q=${city.lat},${city.lon}`
        );
        const data = await res.json();
        setWeatherData(prev => ({
          ...prev,
          [city.city]: {
            temp: data.current.temp_c,
            desc: data.current.condition.text
          }
        }));
      } catch (err) {
        console.error("Weather fetch error for", city.city, err);
        setWeatherData(prev => ({
          ...prev,
          [city.city]: { temp: "N/A", desc: "N/A" }
        }));
      }
    });
  }, [cities, WEATHERAPI_KEY]);

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
          position: "fixed",
          bottom: 20,
          right: 20,
          backgroundColor: "rgba(255,255,255,0.9)",
          padding: "12px 18px",
          borderRadius: "10px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          cursor: "pointer",
          userSelect: "none",
          fontSize: "14px",
          fontWeight: "bold",
          zIndex: 10000,
          touchAction: "auto",
        }}
        onClick={() => setShowTooltips(prev => !prev)}
      >
        {showTooltips ? "A skitrej mu" : "A dej mu"}
      </div>
    </div>
  );
}

export default App;
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from "react-leaflet";
import L from "leaflet";
import Papa from "papaparse";
import axios from "axios";
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

const OPENWEATHER_KEY = "YOUR_OPENWEATHERMAP_API_KEY"; // replace with your key

function App() {
  const [cities, setCities] = useState([]);
  const [weatherData, setWeatherData] = useState({});

  // Load CSV from public folder
  useEffect(() => {
    fetch("/data/cities.csv")
      .then((res) => res.text())
      .then((csvText) => {
        const { data, errors } = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        if (errors.length > 0) console.warn("CSV parse errors:", errors);

        // Filter empty rows and parse dates/coordinates
        const parsed = data
          .filter(row => row.city && row.latitude && row.longitude)
          .map(row => {
            const city = row.city.trim();
            const lat = parseFloat(row.latitude);
            const lon = parseFloat(row.longitude);

            let dayMonth = (row.date || "").replace(/\.$/, "");
            const [day, month] = dayMonth.split(".");
            const date = `2026-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

            return { city, lat, lon, date };
          });

        setCities(parsed);
      });
  }, []);

  // Fetch weather for each city
  useEffect(() => {
    if (cities.length === 0) return;

    cities.forEach(async (city) => {
      try {
        const res = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&units=metric&appid=${OPENWEATHER_KEY}`
        );
        setWeatherData(prev => ({
          ...prev,
          [city.city]: {
            temp: res.data.main.temp.toFixed(1),
            desc: res.data.weather[0].main
          }
        }));
      } catch (err) {
        console.error("Weather fetch error for", city.city, err);
      }
    });
  }, [cities]);

  // Polyline coordinates
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
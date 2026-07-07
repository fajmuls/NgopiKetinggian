import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Thermometer, Wind } from 'lucide-react';

interface WeatherWidgetProps {
  location: string;
}

export const WeatherWidget = ({ location }: WeatherWidgetProps) => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        // Simple weather API from wttr.in
        const res = await fetch(`https://wttr.in/${location}?format=j1`);
        const data = await res.json();
        setWeather(data.current_condition[0]);
      } catch (err) {
        console.error("Weather fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    if (location) fetchWeather();
  }, [location]);

  if (loading) return (
    <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl animate-pulse h-24 flex items-center justify-center">
      <Cloud className="text-art-text/20 animate-bounce" size={24} />
    </div>
  );

  if (!weather) return null;

  return (
    <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-art-text/5 shadow-sm space-y-3 group hover:shadow-md transition-all">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-black uppercase text-art-text/40 tracking-widest mb-1">Prakiraan Cuaca</p>
          <h4 className="text-sm font-black text-art-text">{location}</h4>
        </div>
        <div className="bg-art-orange/10 p-2 rounded-xl">
           {parseInt(weather.precipMM) > 0 ? <CloudRain className="text-art-orange" size={20} /> : <Sun className="text-art-orange" size={20} />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Thermometer size={14} className="text-art-orange" />
          <div>
            <p className="text-[10px] font-bold text-art-text/40 uppercase leading-none">Suhu</p>
            <p className="text-xs font-black text-art-text">{weather.temp_C}°C</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wind size={14} className="text-art-orange" />
          <div>
            <p className="text-[10px] font-bold text-art-text/40 uppercase leading-none">Angin</p>
            <p className="text-xs font-black text-art-text">{weather.windspeedKmph} km/h</p>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-art-text/5">
        <p className="text-[9px] font-bold text-art-text/60 italic">
          Kondisi: {weather.lang_id?.[0]?.value || weather.weatherDesc?.[0]?.value}
        </p>
      </div>
    </div>
  );
};

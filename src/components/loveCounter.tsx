import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";

export const LoveCounter: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const startDate = new Date("2024-09-01T00:00:00");
    const timer = setInterval(() => {
      const now = new Date();
      const difference = now.getTime() - startDate.getTime();
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mb-12 bg-gradient-to-r from-pink-500 to-rose-400 p-8 rounded-[32px] text-white shadow-xl shadow-pink-100 relative overflow-hidden group">
      <Heart
        className="absolute -right-4 -bottom-4 text-white/10 rotate-12 group-hover:scale-110 transition-transform duration-700"
        size={160}
        fill="currentColor"
      />
      <div className="relative z-10">
        <h3 className="text-sm font-black uppercase tracking-[0.3em] mb-4 text-pink-100 flex items-center gap-2">
          <Heart size={14} fill="currentColor" /> Tiempo Juntos
        </h3>
        <div className="flex flex-wrap gap-6 items-end">
          <div className="flex flex-col">
            <span className="text-5xl md:text-6xl font-black font-serif italic">
              {timeLeft.days}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-pink-100 mt-1">
              Días Juntos
            </span>
          </div>
          <div className="flex gap-3 text-2xl md:text-3xl font-serif italic mb-1 text-pink-50">
            <span>{timeLeft.hours.toString().padStart(2, "0")}h</span>
            <span>:</span>
            <span>{timeLeft.minutes.toString().padStart(2, "0")}m</span>
            <span>:</span>
            <span className="w-8">
              {timeLeft.seconds.toString().padStart(2, "0")}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

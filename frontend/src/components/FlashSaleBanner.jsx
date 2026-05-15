import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFlashSale } from '../api';

function getTimeLeft(endDate) {
  const diff = new Date(endDate) - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function FlashSaleBanner() {
  const [sale, setSale] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    getFlashSale()
      .then(res => {
        const data = res.data;
        setSale(data);
        if (data?.active && data?.end_date) {
          setTimeLeft(getTimeLeft(data.end_date));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!sale?.active || !sale?.end_date) return;
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(sale.end_date));
    }, 1000);
    return () => clearInterval(timer);
  }, [sale?.end_date, sale?.active]);

  if (!sale?.active || !sale?.end_date || !timeLeft) return null;

  const units = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hrs' },
    { value: timeLeft.minutes, label: 'Min' },
    { value: timeLeft.seconds, label: 'Sec' },
  ];

  const countdown = (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4">
      {/* Sale label */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span
          className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full animate-pulse"
          style={{ background: '#e53e3e', color: '#fff' }}
        >
          ⚡ FLASH SALE
        </span>
        <div className="hidden sm:block">
          <p className="text-white font-bold text-sm leading-tight">Limited Time Offer!</p>
          <p className="text-xs" style={{ color: '#C9A84C' }}>Grab it before it's gone</p>
        </div>
      </div>

      {/* Countdown timer */}
      <div className="flex items-center gap-1.5">
        {units.map(({ value, label }, i) => (
          <div key={label} className="flex items-center gap-1.5">
            {i > 0 && (
              <span className="font-bold text-lg leading-none" style={{ color: '#C9A84C' }}>:</span>
            )}
            <div
              className="text-center rounded-lg px-2.5 py-1.5 min-w-[48px]"
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(201,168,76,0.3)' }}
            >
              <div className="text-xl sm:text-2xl font-bold text-white tabular-nums leading-none">
                {pad(value)}
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#C9A84C' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        to="/shop"
        className="flex-shrink-0 font-bold px-6 py-2.5 rounded-full text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 whitespace-nowrap"
        style={{ background: 'linear-gradient(135deg, #C9A84C, #e0b84d)', color: '#082e2b' }}
      >
        Shop Now →
      </Link>
    </div>
  );

  if (sale.banner_image_url) {
    return (
      <div className="overflow-hidden">
        {/* Full flyer image — block element so it sets its own height */}
        <div className="relative">
          <img
            src={sale.banner_image_url}
            alt="Flash Sale"
            className="w-full block object-contain"
            style={{ background: '#082e2b' }}
          />
          <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C 30%, #C9A84C 70%, transparent)' }} />
        </div>

        {/* Countdown strip below the flyer */}
        <div style={{ background: '#082e2b' }}>
          <div className="h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C 30%, #C9A84C 70%, transparent)' }} />
          {countdown}
          <div className="h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C 30%, #C9A84C 70%, transparent)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #082e2b 0%, #0D4A47 50%, #082e2b 100%)' }}
      />
      <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C 30%, #C9A84C 70%, transparent)' }} />
      <div className="absolute bottom-0 inset-x-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #C9A84C 30%, #C9A84C 70%, transparent)' }} />
      <div className="relative z-10">
        {countdown}
      </div>
    </div>
  );
}

import React from 'react';
import type { ObstacleType, PowerupType } from '../../utils/carRaceEngine';

interface PlayerCarSVGProps {
  hasShield?: boolean;
  isNitro?: boolean;
  isBlinking?: boolean;
}

export const PlayerCarSVG: React.FC<PlayerCarSVGProps> = ({
  hasShield,
  isNitro,
  isBlinking,
}) => {
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center transition-opacity ${
        isBlinking ? 'animate-pulse opacity-40' : 'opacity-100'
      }`}
    >
      {/* Shield Aura */}
      {hasShield && (
        <div className="absolute -inset-2 rounded-full border-2 border-cyan-400 bg-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-pulse pointer-events-none" />
      )}

      {/* Nitro Flames */}
      {isNitro && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-6 h-6 flex justify-center pointer-events-none">
          <div className="w-2.5 h-6 bg-gradient-to-t from-amber-500 via-yellow-400 to-transparent rounded-full animate-bounce shadow-[0_0_12px_#F59E0B]" />
        </div>
      )}

      {/* Player Car Body */}
      <svg
        viewBox="0 0 60 100"
        className="w-full h-full drop-shadow-[0_10px_10px_rgba(0,0,0,0.6)]"
      >
        <defs>
          <linearGradient id="playerCarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <filter id="glowLight">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Wheels */}
        <rect x="2" y="12" width="7" height="18" rx="3" fill="#0F172A" />
        <rect x="51" y="12" width="7" height="18" rx="3" fill="#0F172A" />
        <rect x="2" y="70" width="7" height="18" rx="3" fill="#0F172A" />
        <rect x="51" y="70" width="7" height="18" rx="3" fill="#0F172A" />

        {/* Body Base */}
        <path
          d="M 12,25 C 12,12 20,5 30,5 C 40,5 48,12 48,25 L 50,75 C 50,88 42,95 30,95 C 18,95 10,88 10,75 Z"
          fill="url(#playerCarGrad)"
          stroke="#38BDF8"
          strokeWidth="1.5"
        />

        {/* Windshield */}
        <path d="M 16,32 L 44,32 L 40,48 L 20,48 Z" fill="#0F172A" opacity="0.85" />

        {/* Roof */}
        <path d="M 20,49 L 40,49 L 38,68 L 22,68 Z" fill="#1E293B" />

        {/* Rear Glass */}
        <path d="M 22,69 L 38,69 L 36,78 L 24,78 Z" fill="#0F172A" opacity="0.8" />

        {/* Headlights (Cyan/White Glow) */}
        <ellipse cx="17" cy="8" rx="3" ry="2" fill="#E0F2FE" filter="url(#glowLight)" />
        <ellipse cx="43" cy="8" rx="3" ry="2" fill="#E0F2FE" filter="url(#glowLight)" />

        {/* Taillights */}
        <rect x="14" y="93" width="8" height="3" rx="1" fill="#EF4444" filter="url(#glowLight)" />
        <rect x="38" y="93" width="8" height="3" rx="1" fill="#EF4444" filter="url(#glowLight)" />

        {/* Racing Stripes */}
        <rect x="28" y="6" width="4" height="88" fill="#F8FAFC" opacity="0.9" />
      </svg>
    </div>
  );
};

interface ObstacleSVGProps {
  type: ObstacleType;
  color?: string;
  swerving?: boolean;
  widthLanes?: number;
}

export const ObstacleSVG: React.FC<ObstacleSVGProps> = ({
  type,
  color = '#EF4444',
  swerving,
  widthLanes: _widthLanes = 1,
}) => {
  if (type === 'car' || type === 'swerving-car') {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Blinking Indicators if swerving */}
        {swerving && (
          <div className="absolute -top-1 inset-x-0 flex justify-between px-1 pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          </div>
        )}
        <svg viewBox="0 0 60 100" className="w-full h-full drop-shadow-md">
          {/* Wheels */}
          <rect x="3" y="14" width="6" height="16" rx="2" fill="#1E293B" />
          <rect x="51" y="14" width="6" height="16" rx="2" fill="#1E293B" />
          <rect x="3" y="70" width="6" height="16" rx="2" fill="#1E293B" />
          <rect x="51" y="70" width="6" height="16" rx="2" fill="#1E293B" />

          {/* Body */}
          <path
            d="M 12,20 C 12,10 22,6 30,6 C 38,6 48,10 48,20 L 49,78 C 49,88 40,94 30,94 C 20,94 11,88 11,78 Z"
            fill={color}
            stroke="#FFFFFF"
            strokeWidth="1"
          />

          {/* Cabin */}
          <path d="M 17,30 L 43,30 L 39,46 L 21,46 Z" fill="#0F172A" opacity="0.9" />
          <path d="M 21,47 L 39,47 L 37,66 L 23,66 Z" fill="#334155" />

          {/* Red Taillights facing player (Top in oncoming/same dir view) */}
          <rect x="14" y="91" width="7" height="3" rx="1" fill="#EF4444" />
          <rect x="39" y="91" width="7" height="3" rx="1" fill="#EF4444" />
        </svg>
      </div>
    );
  }

  if (type === 'cone-row') {
    return (
      <div className="w-full h-full flex items-center justify-around">
        {[0, 1, 2].map((i) => (
          <svg key={i} viewBox="0 0 30 30" className="w-7 h-7 drop-shadow">
            {/* Cone Base */}
            <polygon points="2,28 28,28 22,22 8,22" fill="#C2410C" />
            {/* Cone Body */}
            <polygon points="8,22 22,22 15,2" fill="#EA580C" />
            {/* Reflective Stripe */}
            <polygon points="11,14 19,14 17,8 13,8" fill="#F8FAFC" />
          </svg>
        ))}
      </div>
    );
  }

  if (type === 'barrier') {
    return (
      <div className="w-full h-full flex items-center justify-center p-1">
        <svg viewBox="0 0 100 30" className="w-full h-full drop-shadow-lg">
          {/* Barrier Legs */}
          <rect x="10" y="20" width="8" height="10" fill="#334155" />
          <rect x="82" y="20" width="8" height="10" fill="#334155" />
          {/* Striped Main Bar */}
          <rect x="2" y="2" width="96" height="18" rx="3" fill="#DC2626" stroke="#FFFFFF" strokeWidth="1" />
          {/* White stripes */}
          <polygon points="12,2 24,2 14,20 2,20" fill="#F8FAFC" />
          <polygon points="36,2 48,2 38,20 26,20" fill="#F8FAFC" />
          <polygon points="60,2 72,2 62,20 50,20" fill="#F8FAFC" />
          <polygon points="84,2 96,2 86,20 74,20" fill="#F8FAFC" />
          {/* Flashing Yellow Warning Lamps */}
          <circle cx="15" cy="-2" r="3" fill="#F59E0B" className="animate-pulse" />
          <circle cx="85" cy="-2" r="3" fill="#F59E0B" className="animate-pulse" />
        </svg>
      </div>
    );
  }

  if (type === 'oil') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <svg viewBox="0 0 60 40" className="w-4/5 h-4/5 opacity-85">
          <ellipse cx="30" cy="20" rx="26" ry="16" fill="#090D16" />
          <ellipse cx="25" cy="18" rx="14" ry="8" fill="#1E293B" />
          <ellipse cx="35" cy="22" rx="10" ry="5" fill="#3B82F6" opacity="0.3" />
        </svg>
      </div>
    );
  }

  if (type === 'pothole') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <svg viewBox="0 0 50 30" className="w-3/4 h-3/4">
          <ellipse cx="25" cy="15" rx="20" ry="10" fill="#020617" stroke="#475569" strokeWidth="1.5" />
          <path d="M 10,15 Q 25,22 40,15" stroke="#1E293B" strokeWidth="2" fill="none" />
        </svg>
      </div>
    );
  }

  if (type === 'truck') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-xl">
          {/* Large Semi Truck Trailer */}
          <rect x="10" y="5" width="100" height="70" rx="6" fill="#475569" stroke="#94A3B8" strokeWidth="2" />
          {/* Trailer details */}
          <rect x="15" y="10" width="90" height="60" fill="#1E293B" rx="3" />
          <text x="60" y="45" textAnchor="middle" fill="#F8FAFC" fontSize="11" fontWeight="900">
            AĞIR VASITA
          </text>
          {/* Cab at front */}
          <rect x="25" y="75" width="70" height="20" rx="4" fill="#DC2626" />
          <rect x="30" y="80" width="60" height="8" fill="#0F172A" />
          {/* Wheels */}
          <rect x="2" y="15" width="8" height="18" rx="2" fill="#020617" />
          <rect x="110" y="15" width="8" height="18" rx="2" fill="#020617" />
          <rect x="2" y="50" width="8" height="18" rx="2" fill="#020617" />
          <rect x="110" y="50" width="8" height="18" rx="2" fill="#020617" />
        </svg>
      </div>
    );
  }

  if (type === 'roadwork') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <div className="text-[9px] font-black text-amber-400 bg-amber-400/20 border border-amber-400 px-2 py-0.5 rounded-full mb-1 animate-pulse">
          🚧 YOL ÇALIŞMASI 🚧
        </div>
        <svg viewBox="0 0 100 30" className="w-full h-full">
          <rect x="5" y="5" width="90" height="16" fill="#F59E0B" rx="2" />
          <polygon points="10,5 25,5 15,21 0,21" fill="#000000" />
          <polygon points="35,5 50,5 40,21 25,21" fill="#000000" />
          <polygon points="60,5 75,5 65,21 50,21" fill="#000000" />
          <polygon points="85,5 100,5 90,21 75,21" fill="#000000" />
        </svg>
      </div>
    );
  }

  return null;
};

interface PowerupSVGProps {
  type: PowerupType;
}

export const PowerupSVG: React.FC<PowerupSVGProps> = ({ type }) => {
  return (
    <div className="w-8 h-8 rounded-full bg-slate-950/90 border-2 border-white/80 flex items-center justify-center shadow-lg animate-bounce">
      {type === 'shield' && (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-cyan-400 stroke-white">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )}
      {type === 'nitro' && (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-amber-400 stroke-amber-200">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      )}
      {type === 'double-points' && (
        <span className="text-xs font-black text-emerald-400 tracking-tighter">2x</span>
      )}
      {type === 'repair' && (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-rose-500 stroke-white">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      )}
      {type === 'magnet' && (
        <span className="text-sm font-black text-indigo-400">🧲</span>
      )}
    </div>
  );
};

export const HeartSVG: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    viewBox="0 0 24 24"
    className={`w-4 h-4 transition-all ${
      active
        ? 'fill-rose-500 text-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]'
        : 'fill-slate-800 text-slate-700 opacity-30'
    }`}
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

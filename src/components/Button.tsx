import React from 'react';
import { playBeepSound, triggerVibration } from '../utils/audio';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  soundEnabled = true,
  vibrationEnabled = true,
  children,
  className = '',
  onClick,
  disabled,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    playBeepSound(500, 0.08, soundEnabled);
    triggerVibration(15, vibrationEnabled);
    if (onClick) {
      onClick(e);
    }
  };

  const baseStyles =
    'relative inline-flex items-center justify-center font-bold rounded-2xl transition-all transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none shadow-md focus:outline-none';

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-6 py-3.5 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-2.5',
    xl: 'px-10 py-5 text-xl font-extrabold gap-3 tracking-wide',
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/25 border-b-4 border-blue-700 active:border-b-0 active:translate-y-1',
    secondary:
      'bg-slate-800 text-slate-100 hover:bg-slate-700 border-b-4 border-slate-950 active:border-b-0 active:translate-y-1',
    accent:
      'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:from-amber-300 hover:to-orange-400 shadow-orange-500/20 border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 font-black',
    danger:
      'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-400 hover:to-rose-500 border-b-4 border-rose-800 active:border-b-0 active:translate-y-1',
    ghost:
      'bg-white/10 text-white hover:bg-white/20 border border-white/20 active:bg-white/30',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

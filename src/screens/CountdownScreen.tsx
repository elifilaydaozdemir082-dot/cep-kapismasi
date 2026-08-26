import React, { useEffect, useState } from 'react';
import { playBeepSound, triggerVibration } from '../utils/audio';

interface CountdownScreenProps {
  onCountdownComplete: () => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const CountdownScreen: React.FC<CountdownScreenProps> = ({
  onCountdownComplete,
  soundEnabled,
  vibrationEnabled,
}) => {
  const [step, setStep] = useState<number>(3);
  const [text, setText] = useState<string>('3');

  useEffect(() => {
    // Play initial beep for '3'
    playBeepSound(440, 0.15, soundEnabled);
    triggerVibration(20, vibrationEnabled);

    const interval = setInterval(() => {
      setStep((prev) => {
        const next = prev - 1;
        if (next === 2) {
          setText('2');
          playBeepSound(440, 0.15, soundEnabled);
          triggerVibration(20, vibrationEnabled);
        } else if (next === 1) {
          setText('1');
          playBeepSound(440, 0.15, soundEnabled);
          triggerVibration(20, vibrationEnabled);
        } else if (next === 0) {
          setText('BAŞLA!');
          playBeepSound(880, 0.3, soundEnabled);
          triggerVibration([30, 50, 30], vibrationEnabled);
        } else {
          clearInterval(interval);
          onCountdownComplete();
        }
        return next;
      });
    }, 900);

    return () => clearInterval(interval);
  }, [onCountdownComplete, soundEnabled, vibrationEnabled]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-white select-none p-6 overflow-hidden">
      <div className="text-center space-y-4">
        <p className="text-sm font-extrabold uppercase tracking-widest text-cyan-400">
          HAZIRLANIN!
        </p>

        <div key={text} className="animate-scale-up">
          <span
            className={`font-black tracking-tight drop-shadow-2xl ${
              step === 0
                ? 'text-6xl sm:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500'
                : 'text-8xl sm:text-9xl text-white'
            }`}
          >
            {text}
          </span>
        </div>

        <p className="text-xs text-slate-500 font-medium">
          Geri sayım bitince seri şekilde dokunun!
        </p>
      </div>
    </div>
  );
};

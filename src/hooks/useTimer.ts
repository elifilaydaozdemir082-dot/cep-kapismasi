import { useCallback, useEffect, useRef, useState } from 'react';

interface UseTimerOptions {
  durationSeconds: number;
  onFinish?: () => void;
  autoStart?: boolean;
}

export function useTimer({ durationSeconds, onFinish, autoStart = false }: UseTimerOptions) {
  const [timeLeft, setTimeLeft] = useState<number>(durationSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(autoStart);

  const timerRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const hasFinishedRef = useRef<boolean>(false);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const start = useCallback(() => {
    stop();
    hasFinishedRef.current = false;
    setTimeLeft(durationSeconds);
    endTimeRef.current = Date.now() + durationSeconds * 1000;
    setIsRunning(true);

    timerRef.current = window.setInterval(() => {
      if (!endTimeRef.current) return;
      const now = Date.now();
      const remainingMs = Math.max(0, endTimeRef.current - now);
      const remainingSec = Math.ceil(remainingMs / 1000);

      setTimeLeft(remainingSec);

      if (remainingMs <= 0) {
        if (timerRef.current !== null) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setIsRunning(false);
        if (!hasFinishedRef.current) {
          hasFinishedRef.current = true;
          onFinishRef.current?.();
        }
      }
    }, 100);
  }, [durationSeconds, stop]);

  const reset = useCallback(() => {
    stop();
    hasFinishedRef.current = false;
    setTimeLeft(durationSeconds);
  }, [durationSeconds, stop]);

  useEffect(() => {
    if (autoStart) {
      start();
    }
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [autoStart, start]);

  return {
    timeLeft,
    isRunning,
    start,
    stop,
    reset,
  };
}

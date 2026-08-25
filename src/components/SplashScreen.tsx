import { useState, useRef, useEffect } from "react";

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fade, setFade] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    // Safety auto-advance if video stalls
    const timer = setTimeout(() => {
      handleComplete();
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  const handleComplete = () => {
    setFade(true);
    setTimeout(() => {
      onFinish();
    }, 400);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#0B0E14] flex items-center justify-center transition-opacity duration-400 ${
        fade ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {!videoError ? (
        <video
          ref={videoRef}
          src="/splash.mp4"
          autoPlay
          muted
          playsInline
          onEnded={handleComplete}
          onError={() => setVideoError(true)}
          className="w-full h-full object-cover max-h-screen"
        />
      ) : (
        <div className="flex flex-col items-center space-y-4 px-6 text-center">
          <div className="w-16 h-16 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
          <h1 className="text-xl font-black text-white tracking-wider uppercase">CapitalGuard</h1>
          <p className="text-xs text-slate-400">Calibrating Risk Shield...</p>
        </div>
      )}

      {/* Manual Skip */}
      <button
        onClick={handleComplete}
        className="absolute top-6 right-6 px-3.5 py-1.5 rounded-full bg-slate-900/70 backdrop-blur-md border border-slate-700/60 text-xs font-semibold text-slate-300 hover:text-white"
      >
        Skip
      </button>
    </div>
  );
}
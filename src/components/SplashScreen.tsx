import { useState, useEffect, useRef } from "react";
import { ShieldCheck, Volume2, VolumeX, Sparkles } from "lucide-react";

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [fade, setFade] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const duration = 12000;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return Math.min(100, prev + step);
      });
    }, intervalTime);

    const fallbackTimeout = setTimeout(() => {
      handleComplete();
    }, 12500);

    return () => {
      clearInterval(timer);
      clearTimeout(fallbackTimeout);
    };
  }, []);

  const handleComplete = () => {
    setFade(true);
    setTimeout(onFinish, 600);
  };

  const toggleAudio = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#0B0E14] overflow-hidden flex flex-col items-center justify-center transition-opacity duration-700 select-none ${
        fade ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* 🎬 12s Full-Bleed Video Background */}
      <video
        ref={videoRef}
        src="/splash.mp4"
        autoPlay
        playsInline
        muted={isMuted}
        onEnded={handleComplete}
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Cinematic Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-[#0B0E14]/80 pointer-events-none z-10" />

      {/* 🛡️ TOP BRAND LOGO & BADGE */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#151A23]/80 backdrop-blur-md border border-amber-500/30 shadow-[0_0_20px_rgba(251,191,36,0.15)]">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-black uppercase tracking-wider text-white">
            CAPITALGUARD
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleAudio}
            className="p-2.5 rounded-2xl bg-[#151A23]/80 backdrop-blur-md border border-[#222B3A] text-slate-400 hover:text-white transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
          <button
            onClick={handleComplete}
            className="px-4 py-2 rounded-2xl bg-[#151A23]/80 backdrop-blur-md border border-[#222B3A] text-xs font-bold text-slate-400 hover:text-white transition"
          >
            Skip Intro
          </button>
        </div>
      </div>

      {/* ⏱️ BOTTOM CALIBRATION PROGRESS BAR */}
      <div className="absolute bottom-8 left-6 right-6 max-w-md mx-auto z-20 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
          <span className="tracking-wider uppercase text-[10px] flex items-center gap-1 text-amber-400 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Calibrating Simultaneous Risk Shield...</span>
          </span>
          <span className="text-amber-400 font-black">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-1.5 bg-[#151A23]/90 backdrop-blur-sm rounded-full overflow-hidden border border-[#222B3A]">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-sky-400 to-emerald-400 transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
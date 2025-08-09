export default function AnimatedCandle() {
  return (
    <div className="relative w-20 h-32">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-24 bg-slate-100 rounded-t-md border-2 border-slate-200"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-8 bg-yellow-400 rounded-full animate-flicker">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-4 bg-orange-500 rounded-full"></div>
      </div>
      <style jsx>{`
        @keyframes flicker {
          0%, 100% { transform: scale(1, 1) rotate(-1deg); opacity: 1; }
          50% { transform: scale(1.1, 0.9) rotate(1deg); opacity: 0.9; }
        }
        .animate-flicker {
          animation: flicker 1.5s ease-in-out infinite;
          transform-origin: bottom;
        }
      `}</style>
    </div>
  );
}

export default function ChatGPTBall({ isListening }) {
  const animationClass = isListening ? 'animate-breathing' : '';
  return (
    <div className={`w-20 h-20 rounded-full relative overflow-hidden bg-gradient-to-tr from-blue-500 to-cyan-300 ${animationClass}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent transform-gpu scale-150 rotate-45"></div>
      <style jsx>{`
        @keyframes breathing {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .animate-breathing {
          animation: breathing 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

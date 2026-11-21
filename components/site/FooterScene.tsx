'use client';

/**
 * FooterScene
 *
 * A slim, dependency-free animated band for the footer: a sunrise behind a
 * West-Bengal rooftop skyline, panels catching a moving shine, birds drifting,
 * and two layered energy waves rolling underneath. Pure SVG + CSS, so it adds
 * no bundle weight and respects `prefers-reduced-motion`.
 */
export default function FooterScene() {
  return (
    <div className="fs-scene relative w-full overflow-hidden" aria-hidden="true">
      <svg viewBox="0 0 1200 180" preserveAspectRatio="xMidYMax slice" className="h-[120px] w-full sm:h-[150px]">
        <defs>
          <linearGradient id="fsSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0C382A" />
            <stop offset="100%" stopColor="#114B38" />
          </linearGradient>
          <radialGradient id="fsSun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE9A8" />
            <stop offset="60%" stopColor="#F6C34A" />
            <stop offset="100%" stopColor="#F3A712" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="fsWave1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1E7A4E" />
            <stop offset="100%" stopColor="#2FA866" />
          </linearGradient>
          <linearGradient id="fsShine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* sky */}
        <rect x="0" y="0" width="1200" height="180" fill="url(#fsSky)" />

        {/* glowing rising sun */}
        <circle className="fs-sun" cx="600" cy="150" r="120" fill="url(#fsSun)" />

        {/* drifting birds */}
        <g className="fs-birds" stroke="#CFE0D4" strokeWidth="2.4" fill="none" strokeLinecap="round">
          <path d="M180 54 q 8 -8 16 0 q 8 -8 16 0" />
          <path d="M250 40 q 6 -6 12 0 q 6 -6 12 0" />
          <path d="M320 60 q 7 -7 14 0 q 7 -7 14 0" />
        </g>

        {/* rooftop skyline with solar panels */}
        <g fill="#0A2C1F">
          <rect x="120" y="108" width="150" height="72" />
          <rect x="300" y="88" width="180" height="92" />
          <rect x="520" y="116" width="150" height="64" />
          <rect x="720" y="92" width="180" height="88" />
          <rect x="940" y="110" width="150" height="70" />
        </g>
        {/* panels on the roofs (tilted) + moving shine */}
        <g>
          <g transform="translate(316 70)">
            <polygon points="0,14 54,0 150,20 96,36" fill="#15345C" stroke="#0A1E3A" strokeWidth="1.5" />
            <polygon className="fs-shine" points="0,14 54,0 150,20 96,36" fill="url(#fsShine)" />
          </g>
          <g transform="translate(736 74)">
            <polygon points="0,14 54,0 150,20 96,36" fill="#15345C" stroke="#0A1E3A" strokeWidth="1.5" />
            <polygon className="fs-shine fs-shine-2" points="0,14 54,0 150,20 96,36" fill="url(#fsShine)" />
          </g>
        </g>

        {/* energy waves */}
        <path
          className="fs-wave fs-wave-a"
          d="M0 140 q 150 -26 300 0 t 300 0 t 300 0 t 300 0 V180 H0 Z"
          fill="url(#fsWave1)"
          opacity="0.9"
        />
        <path
          className="fs-wave fs-wave-b"
          d="M0 150 q 150 -22 300 0 t 300 0 t 300 0 t 300 0 V180 H0 Z"
          fill="#0E4030"
          opacity="0.85"
        />
      </svg>

      <style jsx>{`
        .fs-scene {
          line-height: 0;
        }
        .fs-sun {
          animation: fsSun 6s ease-in-out infinite;
          transform-origin: 600px 150px;
        }
        .fs-birds {
          animation: fsBirds 24s linear infinite;
        }
        .fs-shine {
          animation: fsShine 5s ease-in-out infinite;
        }
        .fs-shine-2 {
          animation-delay: 2.5s;
        }
        .fs-wave {
          width: 200%;
        }
        .fs-wave-a {
          animation: fsWave 9s ease-in-out infinite;
        }
        .fs-wave-b {
          animation: fsWave 12s ease-in-out infinite reverse;
        }

        @keyframes fsSun {
          0%,
          100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.06);
          }
        }
        @keyframes fsBirds {
          0% {
            transform: translateX(-120px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(1200px);
            opacity: 0;
          }
        }
        @keyframes fsShine {
          0%,
          65% {
            opacity: 0;
            transform: translateX(-10px);
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateX(14px);
          }
        }
        @keyframes fsWave {
          0%,
          100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(-60px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fs-sun,
          .fs-birds,
          .fs-shine,
          .fs-wave {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

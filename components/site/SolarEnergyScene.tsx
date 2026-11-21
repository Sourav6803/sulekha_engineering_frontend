'use client';

/**
 * SolarEnergyScene
 *
 * A self-contained, dependency-free animated illustration for the hero.
 * Pure SVG + CSS (no three.js / lottie), so it adds zero bundle weight and
 * can never break the build. It tells the whole story a visitor needs:
 *   sun → rooftop panels → inverter → grid → a home where the lamp glows,
 *   the fan spins, and a family stands in front of it.
 *
 * Everything is driven by CSS keyframes defined inline below, scoped with an
 * `se-` prefix so it cannot collide with anything else on the page.
 */
export default function SolarEnergyScene() {
  return (
    <div className="se-scene relative w-full">
      <svg
        viewBox="0 0 640 520"
        role="img"
        aria-label="Animation of rooftop solar panels generating electricity that powers a home and feeds the grid, with a family in front"
        className="h-auto w-full drop-shadow-[0_24px_48px_rgba(8,43,24,0.18)]"
      >
        <defs>
          <linearGradient id="seSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#DFF5E8" />
            <stop offset="55%" stopColor="#EAF8F0" />
            <stop offset="100%" stopColor="#FBFDF9" />
          </linearGradient>
          <radialGradient id="seSun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF3C7" />
            <stop offset="60%" stopColor="#FACC45" />
            <stop offset="100%" stopColor="#F3A712" />
          </radialGradient>
          <linearGradient id="sePanel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#15345C" />
            <stop offset="100%" stopColor="#0A1E3A" />
          </linearGradient>
          <linearGradient id="seRoof" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B4542E" />
            <stop offset="100%" stopColor="#8E3D1E" />
          </linearGradient>
          <linearGradient id="seGround" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#CDEBD6" />
            <stop offset="100%" stopColor="#A9DBB9" />
          </linearGradient>
          <linearGradient id="seShine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Sky card */}
        <rect x="0" y="0" width="640" height="520" rx="34" fill="url(#seSky)" />

        {/* ---- Sun with rotating rays + pulsing glow ---- */}
        <g className="se-sun">
          <circle cx="120" cy="116" r="64" fill="#FDE9A6" opacity="0.45" className="se-glow" />
          <g className="se-rays" style={{ transformOrigin: '120px 116px' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <rect
                key={i}
                x="117"
                y="34"
                width="6"
                height="22"
                rx="3"
                fill="#F6B931"
                transform={`rotate(${i * 30} 120 116)`}
              />
            ))}
          </g>
          <circle cx="120" cy="116" r="38" fill="url(#seSun)" />
        </g>

        {/* ---- Drifting clouds ---- */}
        <g className="se-cloud se-cloud-1" fill="#ffffff" opacity="0.9">
          <ellipse cx="420" cy="90" rx="34" ry="18" />
          <ellipse cx="452" cy="82" rx="26" ry="16" />
          <ellipse cx="392" cy="82" rx="22" ry="14" />
        </g>
        <g className="se-cloud se-cloud-2" fill="#ffffff" opacity="0.75">
          <ellipse cx="540" cy="150" rx="26" ry="14" />
          <ellipse cx="564" cy="144" rx="20" ry="12" />
        </g>

        {/* ---- Ground ---- */}
        <rect x="0" y="412" width="640" height="108" rx="0" fill="url(#seGround)" />
        <path d="M0 412 Q 160 392 320 412 T 640 412 V520 H0 Z" fill="url(#seGround)" />

        {/* ======================= UTILITY GRID (left) ======================= */}
        <g>
          <rect x="96" y="300" width="10" height="150" rx="3" fill="#6B7B72" />
          <rect x="70" y="312" width="62" height="9" rx="4" fill="#52635A" />
          <rect x="76" y="332" width="50" height="8" rx="4" fill="#52635A" />
          {/* transmission wire to the house, electricity flows along it */}
          <path
            className="se-wire"
            d="M128 318 C 210 300, 300 356, 372 330"
            fill="none"
            stroke="#2FA866"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <text x="101" y="470" textAnchor="middle" fontSize="13" fontWeight="700" fill="#4C6555">
            Grid
          </text>
        </g>

        {/* ======================= HOUSE ======================= */}
        <g>
          {/* Body */}
          <rect x="348" y="300" width="232" height="150" rx="8" fill="#FBF6EC" stroke="#E7D8BE" strokeWidth="2" />
          {/* Roof */}
          <polygon points="334,302 464,232 594,302" fill="url(#seRoof)" />
          <polygon points="334,302 464,232 594,302" fill="#000" opacity="0.06" />

          {/* Solar panel array on the roof (tilted parallelogram) */}
          <g>
            <polygon points="398,290 470,252 556,286 486,326" fill="url(#sePanel)" stroke="#0A1E3A" strokeWidth="2" />
            {/* cell grid lines */}
            <line x1="420" y1="279" x2="508" y2="312" stroke="#2C4A74" strokeWidth="1.4" />
            <line x1="444" y1="266" x2="532" y2="299" stroke="#2C4A74" strokeWidth="1.4" />
            <line x1="446" y1="281" x2="470" y2="268" stroke="#2C4A74" strokeWidth="1.2" />
            <line x1="474" y1="296" x2="498" y2="283" stroke="#2C4A74" strokeWidth="1.2" />
            {/* moving shine sweep */}
            <polygon className="se-shine" points="398,290 470,252 556,286 486,326" fill="url(#seShine)" />
          </g>

          {/* Window with ceiling fan + glowing lamp */}
          <rect x="372" y="330" width="92" height="96" rx="6" fill="#DCEAF6" stroke="#C4D6E6" strokeWidth="2" />
          {/* lamp */}
          <line x1="418" y1="336" x2="418" y2="352" stroke="#8A6D3B" strokeWidth="2.5" />
          <circle className="se-lamp" cx="418" cy="360" r="9" fill="#FFD66B" />
          <circle className="se-lamp-glow" cx="418" cy="360" r="18" fill="#FFE49A" opacity="0.5" />
          {/* ceiling fan */}
          <g className="se-fan" style={{ transformOrigin: '418px 398px' }}>
            <ellipse cx="418" cy="398" rx="30" ry="6" fill="#4C6555" />
            <ellipse cx="418" cy="398" rx="6" ry="24" fill="#4C6555" opacity="0.65" />
          </g>
          <circle cx="418" cy="398" r="4" fill="#2F4336" />

          {/* Door */}
          <rect x="492" y="360" width="56" height="90" rx="5" fill="#A9785A" />
          <circle cx="502" cy="406" r="3" fill="#F3E2C7" />

          {/* Inverter on the wall, energy hub */}
          <rect x="560" y="344" width="26" height="40" rx="4" fill="#20252B" />
          <rect className="se-inv-led" x="566" y="352" width="14" height="5" rx="2.5" fill="#34C46B" />
          <rect x="566" y="362" width="14" height="4" rx="2" fill="#4C6565" />
          <rect x="566" y="370" width="14" height="4" rx="2" fill="#4C6565" />
          {/* wire from panel down to inverter */}
          <path
            className="se-wire se-wire-slow"
            d="M540 300 C 574 312, 576 328, 573 344"
            fill="none"
            stroke="#F3A712"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        {/* Energy orbs travelling panel → inverter → grid */}
        <circle className="se-orb se-orb-1" r="5" fill="#FFD66B" />
        <circle className="se-orb se-orb-2" r="4.5" fill="#34C46B" />
        <circle className="se-orb se-orb-3" r="4.5" fill="#34C46B" />

        {/* ======================= FAMILY ======================= */}
        <g className="se-family">
          {/* Father */}
          <g className="se-bob">
            <circle cx="250" cy="392" r="12" fill="#3B2A1E" />
            <circle cx="250" cy="392" r="9" fill="#E7B98E" />
            <rect x="240" y="404" width="20" height="40" rx="9" fill="#2E7D55" />
            <rect x="242" y="440" width="7" height="24" rx="3" fill="#33414C" />
            <rect x="251" y="440" width="7" height="24" rx="3" fill="#33414C" />
          </g>
          {/* Mother */}
          <g className="se-bob se-bob-2">
            <circle cx="286" cy="398" r="11" fill="#2A1C33" />
            <circle cx="286" cy="398" r="8.5" fill="#EEC19C" />
            <polygon points="286,408 274,452 298,452" fill="#C2426B" />
            <rect x="282" y="448" width="8" height="16" rx="3" fill="#E6B98E" />
          </g>
          {/* Child */}
          <g className="se-bob se-bob-3">
            <circle cx="314" cy="418" r="8" fill="#3B2A1E" />
            <circle cx="314" cy="418" r="6" fill="#F0C7A2" />
            <rect x="308" y="426" width="12" height="26" rx="6" fill="#F3A712" />
            <rect x="309" y="450" width="5" height="15" rx="2" fill="#33414C" />
            <rect x="315" y="450" width="5" height="15" rx="2" fill="#33414C" />
          </g>
        </g>

        {/* little grass tufts */}
        <g stroke="#5FA874" strokeWidth="2.5" strokeLinecap="round">
          <path d="M150 470 q 4 -12 8 0" fill="none" />
          <path d="M360 476 q 4 -12 8 0" fill="none" />
          <path d="M600 472 q 4 -12 8 0" fill="none" />
        </g>
      </svg>

      <style jsx>{`
        .se-scene {
          contain: paint;
        }
        .se-rays {
          animation: seSpin 28s linear infinite;
        }
        .se-glow {
          animation: seGlow 3.5s ease-in-out infinite;
          transform-origin: 120px 116px;
        }
        .se-cloud-1 {
          animation: seDrift 26s linear infinite;
        }
        .se-cloud-2 {
          animation: seDrift 34s linear infinite;
        }
        .se-fan {
          animation: seSpin 0.9s linear infinite;
        }
        .se-lamp,
        .se-lamp-glow {
          animation: seLamp 2.4s ease-in-out infinite;
        }
        .se-inv-led {
          animation: seBlink 1.6s steps(1, end) infinite;
        }
        .se-shine {
          animation: seShine 4.5s ease-in-out infinite;
        }
        .se-wire {
          stroke-dasharray: 10 12;
          animation: seFlow 1.1s linear infinite;
        }
        .se-wire-slow {
          animation-duration: 1.6s;
        }
        .se-orb {
          offset-rotate: 0deg;
        }
        .se-orb-1 {
          offset-path: path('M540 300 C 574 312, 576 328, 573 344');
          animation: seOrb 1.8s ease-in-out infinite;
        }
        .se-orb-2 {
          offset-path: path('M128 318 C 210 300, 300 356, 372 330');
          animation: seOrb 2.4s linear infinite;
        }
        .se-orb-3 {
          offset-path: path('M128 318 C 210 300, 300 356, 372 330');
          animation: seOrb 2.4s linear infinite;
          animation-delay: 1.2s;
        }
        .se-bob {
          animation: seBob 3.2s ease-in-out infinite;
          transform-origin: center;
        }
        .se-bob-2 {
          animation-duration: 3.8s;
          animation-delay: 0.4s;
        }
        .se-bob-3 {
          animation-duration: 2.8s;
          animation-delay: 0.8s;
        }

        @keyframes seSpin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes seGlow {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.08);
          }
        }
        @keyframes seDrift {
          0% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(-34px);
          }
          100% {
            transform: translateX(0);
          }
        }
        @keyframes seLamp {
          0%,
          100% {
            opacity: 0.55;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes seBlink {
          0%,
          60% {
            opacity: 1;
          }
          61%,
          100% {
            opacity: 0.25;
          }
        }
        @keyframes seShine {
          0%,
          70% {
            opacity: 0;
            transform: translateX(-16px);
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateX(18px);
          }
        }
        @keyframes seFlow {
          to {
            stroke-dashoffset: -22;
          }
        }
        @keyframes seOrb {
          0% {
            offset-distance: 0%;
            opacity: 0;
          }
          12% {
            opacity: 1;
          }
          88% {
            opacity: 1;
          }
          100% {
            offset-distance: 100%;
            opacity: 0;
          }
        }
        @keyframes seBob {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .se-rays,
          .se-glow,
          .se-cloud-1,
          .se-cloud-2,
          .se-fan,
          .se-lamp,
          .se-lamp-glow,
          .se-inv-led,
          .se-shine,
          .se-wire,
          .se-orb,
          .se-bob {
            animation: none;
          }
          .se-orb {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

import React from 'react';

export default function Logo({ className = '', size = 40, showText = true }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Stylized circular SVG logo matching the flyer's seal */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Outer navy circle */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="#0C1B33"
          stroke="#CFA13C"
          strokeWidth="2"
        />

        {/* Inner gold concentric circle ring */}
        <circle
          cx="50"
          cy="50"
          r="38"
          stroke="#CFA13C"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* Abstract globe connection lines */}
        <path
          d="M20 50C20 66.5685 33.4315 80 50 80C66.5685 80 80 66.5685 80 50C80 33.4315 66.5685 20 50 20C33.4315 20 20 33.4315 20 50Z"
          stroke="#CFA13C"
          strokeWidth="1.5"
          opacity="0.3"
        />
        <path
          d="M50 20V80M20 50H80"
          stroke="#CFA13C"
          strokeWidth="1"
          opacity="0.2"
        />
        {/* Connective swoosh representing the China-Africa trade route */}
        <path
          d="M30 65C38 45 62 35 70 35"
          stroke="#CFA13C"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* China point (Star/Dot) */}
        <circle cx="70" cy="35" r="4" fill="#CFA13C" />
        {/* Nigeria point (Star/Dot) */}
        <circle cx="30" cy="65" r="4" fill="#CFA13C" />

        {/* Central connecting shield/hands/globe abstract */}
        <path
          d="M42 44C45 40 55 40 58 44C62 50 58 60 50 64C42 60 38 50 42 44Z"
          fill="#FAF9F6"
          stroke="#0C1B33"
          strokeWidth="2"
        />
        {/* Golden inner details */}
        <circle cx="50" cy="51" r="3" fill="#CFA13C" />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className="text-sm font-extrabold tracking-wider text-[#0C1B33] uppercase">
            Africhina
          </span>
          <span className="-mt-1 text-[10px] font-bold tracking-widest text-[#CFA13C] uppercase">
            Connect Ltd
          </span>
        </div>
      )}
    </div>
  );
}

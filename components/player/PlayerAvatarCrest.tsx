'use client';

import React, { useId } from 'react';

interface PlayerAvatarCrestProps {
  pfpSrc: string;
  playerName: string;
  lastSTierPosition?: number | null;
}

export function PlayerAvatarCrest({
  pfpSrc,
  playerName,
}: PlayerAvatarCrestProps) {
  const uniqueId = useId().replace(/:/g, '');
  const clipId = `avatar-hex-clip-${uniqueId}`;
  const mistFilterId = `hex-mist-${uniqueId}`;
  const backFillGradId = `back-fill-${uniqueId}`;
  const backStrokeGradId = `back-stroke-${uniqueId}`;
  const mainFrameGradId = `main-frame-${uniqueId}`;
  const outerRimGradId = `outer-rim-${uniqueId}`;
  const innerShadowId = `inner-shadow-${uniqueId}`;

  return (
    <div className="relative flex items-center justify-center w-36 h-32 sm:w-40 sm:h-36 select-none">
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 129.5 112.7"
        className="w-full h-full overflow-visible"
        aria-label={playerName}
      >
        <defs>
          {/* Inner Hexagon Clip Mask for Player Avatar */}
          <clipPath id={clipId}>
            <polygon points="64.9,110.3 114.2,83.4 114.2,38.5 64.9,2.5 15.6,38.5 15.6,83.4" />
          </clipPath>

          {/* Soft Hexagonal Mist Blur Filter */}
          <filter id={mistFilterId} x="-45%" y="-45%" width="190%" height="190%">
            <feGaussianBlur stdDeviation="7.5" />
          </filter>

          {/* 1. Back Polygon (.st0) Metallic Lighting Gradients */}
          <linearGradient id={backFillGradId} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#A14A10" />
            <stop offset="45%" stopColor="#6D2E0B" />
            <stop offset="100%" stopColor="#3B1504" />
          </linearGradient>

          <linearGradient id={backStrokeGradId} x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="40%" stopColor="#DF8B0B" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          {/* 2. Main Thick Hexagon Frame (.st1) Multi-Stop Metallic Bevel Gradient */}
          <linearGradient id={mainFrameGradId} x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="28%" stopColor="#D97706" />
            <stop offset="65%" stopColor="#92400E" />
            <stop offset="88%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          {/* 3. Outer Fine Rim (.st2) Directional Specular Lighting */}
          <linearGradient id={outerRimGradId} x1="25%" y1="0%" x2="75%" y2="100%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="30%" stopColor="#FDE68A" />
            <stop offset="70%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          {/* Inner Vignette Gradient over Avatar Image for Recessed Depth */}
          <radialGradient id={innerShadowId} cx="50%" cy="50%" r="55%">
            <stop offset="65%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
          </radialGradient>
        </defs>

        {/* 0. Living Hexagonal Mist (Balanced right between subtle and visible) */}
        <g filter={`url(#${mistFilterId})`} className="pointer-events-none">
          {/* Outer breathing hexagonal mist cloud */}
          <polygon
            points="64.9,-2 120,35.5 120,86.5 64.9,115 9.8,86.5 9.8,35.5"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="7"
            strokeLinejoin="round"
          >
            <animate
              attributeName="stroke-opacity"
              values="0.18;0.35;0.18"
              dur="4.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-width"
              values="6;10;6"
              dur="4.5s"
              repeatCount="indefinite"
            />
          </polygon>

          {/* Flowing wisps of bright gold mist drifting along the outer gear contour */}
          <polygon
            points="64.6,112 35.5,107.5 15.5,84 -1.5,55.8 15.5,36.5 35.5,7 64.8,0.5 94,7 114,36.5 131,55.8 114,84 94,107.5"
            pathLength="320"
            fill="none"
            stroke="#FDE047"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="65 55 45 55 70 110"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="400"
              dur="12s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-opacity"
              values="0.2;0.38;0.2"
              dur="4s"
              repeatCount="indefinite"
            />
          </polygon>
        </g>

        {/* 1. Back Polygon (.st0) - Static with Metallic Lighting & Shading */}
        <polygon
          points="64.6,110.3 37.3,106.2 24.8,90.6 16.7,82.8 0.6,55.8 16.7,38 37.2,8.8 64.8,2.5 92.3,8.8 112.8,38 128.9,55.8 112.8,82.8 104.7,90.6 92.2,106.2 64.9,110.3"
          fill={`url(#${backFillGradId})`}
          stroke={`url(#${backStrokeGradId})`}
          strokeWidth="2"
          strokeMiterlimit="10"
        />

        {/* 2. Dark Base Fill Inside Hexagon (.st1 fill) */}
        <polygon
          points="64.9,110.3 114.2,83.4 114.2,38.5 64.9,2.5 15.6,38.5 15.6,83.4"
          fill="#17120A"
        />

        {/* 3. Player Profile Image Clipped to Inner Hexagon */}
        <image
          href={pfpSrc}
          x="13"
          y="1"
          width="104"
          height="111"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />

        {/* 3b. Subtle Inner Depth Shadow over Avatar Edges */}
        <polygon
          points="64.9,110.3 114.2,83.4 114.2,38.5 64.9,2.5 15.6,38.5 15.6,83.4"
          fill={`url(#${innerShadowId})`}
          className="pointer-events-none"
        />

        {/*  Inner Thick Frame (.st1 stroke) with Metallic Gold-to-Bronze Shading */}
        <polygon
          points="64.9,110.3 114.2,83.4 114.2,38.5 64.9,2.5 15.6,38.5 15.6,83.4"
          fill="none"
          stroke={`url(#${mainFrameGradId})`}
          strokeWidth="7"
          strokeMiterlimit="10"
        />

        {/* 4b. Static Inner Bevel Shadow Line (gives the 7px frame a 3D step) */}
        <polygon
          points="64.9,106.5 111,81.5 111,40.2 64.9,6.5 18.8,40.2 18.8,81.5"
          fill="none"
          stroke="#451A03"
          strokeWidth="1"
          strokeOpacity="0.7"
        />

        {/* 5. Outer Fine Gold Rim (.st2) with Static Top-Down Specular Gradient */}
        <polygon
          points="64.9,112.1 116.5,84.3 116.5,37.9 64.9,0.6 13.3,37.9 13.3,84.3"
          fill="none"
          stroke={`url(#${outerRimGradId})`}
          strokeWidth="2"
          strokeMiterlimit="10"
        />

        {/* 6. Static Specular Top-Peak Highlight (Crisp light reflection on top facets) */}
        <polyline
          points="13.3,48 13.3,37.9 64.9,0.6 116.5,37.9 116.5,48"
          fill="none"
          stroke="#FFFBEB"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.9"
        />
      </svg>
    </div>
  );
}

export default PlayerAvatarCrest;

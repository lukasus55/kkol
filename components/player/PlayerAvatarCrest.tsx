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
  lastSTierPosition,
}: PlayerAvatarCrestProps) {
  const uniqueId = useId().replace(/:/g, '');
  const isSTierChampion = lastSTierPosition === 1;

  if (isSTierChampion) {
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
            <clipPath id={clipId}>
              <polygon points="64.9,110.3 114.2,83.4 114.2,38.5 64.9,2.5 15.6,38.5 15.6,83.4" />
            </clipPath>

            <filter id={mistFilterId} x="-45%" y="-45%" width="190%" height="190%">
              <feGaussianBlur stdDeviation="7.5" />
            </filter>

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

            <linearGradient id={mainFrameGradId} x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="28%" stopColor="#D97706" />
              <stop offset="65%" stopColor="#92400E" />
              <stop offset="88%" stopColor="#B45309" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>

            <linearGradient id={outerRimGradId} x1="25%" y1="0%" x2="75%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="30%" stopColor="#FDE68A" />
              <stop offset="70%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>

            <radialGradient id={innerShadowId} cx="50%" cy="50%" r="55%">
              <stop offset="65%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
            </radialGradient>
          </defs>

          {/* Living Hexagonal Gold Mist */}
          <g filter={`url(#${mistFilterId})`} className="pointer-events-none">
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

          {/* Back Polygon (.st0) */}
          <polygon
            points="64.6,110.3 37.3,106.2 24.8,90.6 16.7,82.8 0.6,55.8 16.7,38 37.2,8.8 64.8,2.5 92.3,8.8 112.8,38 128.9,55.8 112.8,82.8 104.7,90.6 92.2,106.2 64.9,110.3"
            fill={`url(#${backFillGradId})`}
            stroke={`url(#${backStrokeGradId})`}
            strokeWidth="2"
            strokeMiterlimit="10"
          />

          {/* Dark Base Fill Inside Hexagon */}
          <polygon
            points="64.9,110.3 114.2,83.4 114.2,38.5 64.9,2.5 15.6,38.5 15.6,83.4"
            fill="#17120A"
          />

          {/* Player Profile Image */}
          <image
            href={pfpSrc}
            x="13"
            y="1"
            width="104"
            height="111"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clipId})`}
          />

          {/* Subtle Inner Depth Shadow */}
          <polygon
            points="64.9,110.3 114.2,83.4 114.2,38.5 64.9,2.5 15.6,38.5 15.6,83.4"
            fill={`url(#${innerShadowId})`}
            className="pointer-events-none"
          />

          {/* Inner Thick Frame (.st1 stroke) */}
          <polygon
            points="64.9,110.3 114.2,83.4 114.2,38.5 64.9,2.5 15.6,38.5 15.6,83.4"
            fill="none"
            stroke={`url(#${mainFrameGradId})`}
            strokeWidth="7"
            strokeMiterlimit="10"
          />

          {/* Static Inner Bevel Shadow Line */}
          <polygon
            points="64.9,106.5 111,81.5 111,40.2 64.9,6.5 18.8,40.2 18.8,81.5"
            fill="none"
            stroke="#451A03"
            strokeWidth="1"
            strokeOpacity="0.7"
          />

          {/* Outer Fine Gold Rim (.st2) */}
          <polygon
            points="64.9,112.1 116.5,84.3 116.5,37.9 64.9,0.6 13.3,37.9 13.3,84.3"
            fill="none"
            stroke={`url(#${outerRimGradId})`}
            strokeWidth="2"
            strokeMiterlimit="10"
          />

          {/* Static Specular Top-Peak Highlight */}
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

  // Standard Silver / Dark-Blue Frame for all other positions
  const stdClipId = `avatar-std-clip-${uniqueId}`;
  const stdMistFilterId = `std-mist-${uniqueId}`;
  const grad1Id = `std-g1-${uniqueId}`;
  const grad2Id = `std-g2-${uniqueId}`;
  const grad3Id = `std-g3-${uniqueId}`;
  const grad4Id = `std-g4-${uniqueId}`;
  const grad5Id = `std-g5-${uniqueId}`;
  const stdInnerShadowId = `std-inner-shadow-${uniqueId}`;

  return (
    <div className="relative flex items-center justify-center w-36 h-36 sm:w-40 sm:h-40 select-none">
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 127.6 127.6"
        className="w-full h-full overflow-visible"
        aria-label={playerName}
      >
        <defs>
          {/* Rotated Diamond Clip Mask matching the exact 81.2x81.2 square */}
          <clipPath id={stdClipId}>
            <rect
              x="23.2"
              y="23.2"
              width="81.2"
              height="81.2"
              transform="matrix(-0.7071 -0.7071 0.7071 -0.7071 63.7778 153.9733)"
            />
          </clipPath>

          <filter id={stdMistFilterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" />
          </filter>

          {/* 1. Back Square Fill Gradient (Multi-stop metallic slate) */}
          <linearGradient
            id={grad1Id}
            gradientUnits="userSpaceOnUse"
            x1="91.2889"
            y1="16.1272"
            x2="36.2667"
            y2="111.4284"
          >
            <stop offset="0" stopColor="#5A626C" />
            <stop offset="0.5" stopColor="#2A323F" />
            <stop offset="1" stopColor="#141922" />
          </linearGradient>

          {/* 2. Back Square Stroke Gradient */}
          <linearGradient
            id={grad2Id}
            gradientUnits="userSpaceOnUse"
            x1="91.9719"
            y1="14.9442"
            x2="35.5837"
            y2="112.6114"
          >
            <stop offset="0" stopColor="#CBD5E1" />
            <stop offset="0.45" stopColor="#64748B" />
            <stop offset="1" stopColor="#334155" />
          </linearGradient>

          {/* 3. Outer Diamond Rim (.st1, 9pt) - Multi-stop silver with bounce light */}
          <linearGradient
            id={grad3Id}
            gradientUnits="userSpaceOnUse"
            x1="91.3944"
            y1="15.9445"
            x2="36.1612"
            y2="111.6112"
          >
            <stop offset="0" stopColor="#E2E8F0" />
            <stop offset="0.32" stopColor="#94A3B8" />
            <stop offset="0.72" stopColor="#475569" />
            <stop offset="1" stopColor="#64748B" />
          </linearGradient>

          {/* 4. Inner Dark Bevel (.st2, 4pt) - Deep steel-blue with top highlight */}
          <linearGradient
            id={grad4Id}
            gradientUnits="userSpaceOnUse"
            x1="89.8635"
            y1="18.5961"
            x2="37.6921"
            y2="108.9595"
          >
            <stop offset="0" stopColor="#5B6B82" />
            <stop offset="0.4" stopColor="#3D485A" />
            <stop offset="0.82" stopColor="#232734" />
            <stop offset="1" stopColor="#333B4D" />
          </linearGradient>

          {/* 5. Specular Top Highlight (.st3) */}
          <linearGradient
            id={grad5Id}
            gradientUnits="userSpaceOnUse"
            x1="33.6994"
            y1="104.8638"
            x2="86.5129"
            y2="13.3881"
          >
            <stop offset="0" stopColor="#C4C9CF" stopOpacity="0" />
            <stop offset="0.55" stopColor="#E2E8F0" stopOpacity="0.45" />
            <stop offset="1" stopColor="#FFFFFF" />
          </linearGradient>

          {/* Inner Vignette Gradient over Avatar Image for Recessed 3D Depth */}
          <radialGradient id={stdInnerShadowId} cx="50%" cy="50%" r="52%">
            <stop offset="60%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#070A0F" stopOpacity="0.6" />
          </radialGradient>
        </defs>

        {/* Living Silver/Steel Mist hugging the diamond-square silhouette (boosted visibility) */}
        <g filter={`url(#${stdMistFilterId})`} className="pointer-events-none">
          {/* Outer breathing silver/steel mist cloud */}
          <polygon
            points="63.8,-3 129.6,63.8 63.8,130.6 -2,63.8"
            fill="none"
            stroke="#94A3B8"
            strokeWidth="8"
            strokeLinejoin="round"
          >
            <animate
              attributeName="stroke-opacity"
              values="0.26;0.52;0.26"
              dur="4.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-width"
              values="7;11;7"
              dur="4.5s"
              repeatCount="indefinite"
            />
          </polygon>

          {/* Drifting bright silver wisps along the square contour */}
          <polygon
            points="23.5,23.5 104.1,23.5 104.1,104.1 23.5,104.1"
            pathLength="320"
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="65 55 45 55 70 110"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="320"
              dur="12s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-opacity"
              values="0.22;0.46;0.22"
              dur="4s"
              repeatCount="indefinite"
            />
          </polygon>
        </g>

        {/* 1. Back Square (.st0) */}
        <rect
          x="23.5"
          y="23.5"
          width="80.6"
          height="80.6"
          fill={`url(#${grad1Id})`}
          stroke={`url(#${grad2Id})`}
          strokeWidth="2"
          strokeMiterlimit="10"
        />

        {/* 2. Outer Diamond (.st1, stroke-width: 9) drawn BEFORE the image so the image covers its inner 4.5pt half! */}
        <rect
          x="23.2"
          y="23.2"
          width="81.2"
          height="81.2"
          transform="matrix(-0.7071 -0.7071 0.7071 -0.7071 63.7778 153.9733)"
          fill="#17120A"
          stroke={`url(#${grad3Id})`}
          strokeWidth="9"
          strokeMiterlimit="10"
        />

        {/* 3. Player Profile Image Clipped to Inner Diamond (covers the inner half of .st1 stroke) */}
        <image
          href={pfpSrc}
          x="6"
          y="6"
          width="115.6"
          height="115.6"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${stdClipId})`}
        />

        {/* 4. Inner Vignette Depth Shadow over the Avatar */}
        <rect
          x="23.2"
          y="23.2"
          width="81.2"
          height="81.2"
          transform="matrix(-0.7071 -0.7071 0.7071 -0.7071 63.7778 153.9733)"
          fill={`url(#${stdInnerShadowId})`}
          className="pointer-events-none"
        />

        {/* 5. Inner Dark Bevel Stroke (.st2, stroke-width: 4) drawn ON TOP of the image */}
        <rect
          x="23.2"
          y="23.2"
          width="81.2"
          height="81.2"
          transform="matrix(-0.7071 -0.7071 0.7071 -0.7071 63.7778 153.9733)"
          fill="none"
          stroke={`url(#${grad4Id})`}
          strokeWidth="4"
          strokeMiterlimit="10"
        />

        {/* 6. Crisp Inner Bevel Step Hairline (separates the 4pt dark frame from the photo) */}
        <rect
          x="25.2"
          y="25.2"
          width="77.2"
          height="77.2"
          transform="matrix(-0.7071 -0.7071 0.7071 -0.7071 63.7778 153.9733)"
          fill="none"
          stroke="#0F141C"
          strokeWidth="1"
          strokeOpacity="0.8"
        />

        {/* 7. Specular Rim Highlight (.st3) */}
        <polyline
          points="118.5,56.3 63.8,1.7 1.8,63.8 54.5,115.7"
          fill="none"
          stroke={`url(#${grad5Id})`}
          strokeWidth="2"
          strokeMiterlimit="10"
        />
      </svg>
    </div>
  );
}

export default PlayerAvatarCrest;

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

type ResourceType = 'forest' | 'stone' | 'plains' | 'wheat' | 'bricks' | 'desert' | 'ship';

interface HexagonData {
  type: ResourceType;
  dice: string;
  probability: string;
  isRed?: boolean;
}

interface ShipData {
  ratio: string;
  resource: string;
}

const mapResources: Record<ResourceType, { name: string, bg: string }> = {
  forest: { name: 'Drewno', bg: '/img/2025/games/catan_icons/forest.webp' },
  stone: { name: 'Ruda', bg: '/img/2025/games/catan_icons/stone.webp' },
  plains: { name: 'Owce', bg: '/img/2025/games/catan_icons/plains.webp' },
  wheat: { name: 'Zboże', bg: '/img/2025/games/catan_icons/wheat.webp' },
  bricks: { name: 'Glina', bg: '/img/2025/games/catan_icons/bricks.webp' },
  desert: { name: 'Pustynia', bg: '/img/2025/games/catan_icons/desert.webp' },
  ship: { name: 'Statek', bg: '' }
};

const round1Rows: HexagonData[][] = [
  [
    { type: 'bricks', dice: '6', probability: '13.889%', isRed: true },
    { type: 'desert', dice: '-', probability: '0%' },
    { type: 'stone', dice: '8', probability: '13.889%', isRed: true }
  ],
  [
    { type: 'plains', dice: '10', probability: '8.333%' },
    { type: 'plains', dice: '12', probability: '2.778%' },
    { type: 'wheat', dice: '5', probability: '11.111%' },
    { type: 'wheat', dice: '11', probability: '5.556%' }
  ],
  [
    { type: 'wheat', dice: '4', probability: '8.333%' },
    { type: 'forest', dice: '8', probability: '13.889%', isRed: true },
    { type: 'bricks', dice: '4', probability: '8.333%' },
    { type: 'forest', dice: '10', probability: '8.333%' },
    { type: 'plains', dice: '6', probability: '13.889%', isRed: true }
  ],
  [
    { type: 'bricks', dice: '9', probability: '11.111%' },
    { type: 'stone', dice: '3', probability: '5.556%' },
    { type: 'forest', dice: '11', probability: '5.556%' },
    { type: 'plains', dice: '3', probability: '5.556%' }
  ],
  [
    { type: 'forest', dice: '5', probability: '11.111%' },
    { type: 'wheat', dice: '2', probability: '2.778%' },
    { type: 'stone', dice: '9', probability: '11.111%' }
  ]
];

const round2Rows: HexagonData[][] = [
  [
    { type: 'forest', dice: '6', probability: '13.889%', isRed: true },
    { type: 'wheat', dice: '5', probability: '11.111%' },
    { type: 'stone', dice: '9', probability: '11.111%' }
  ],
  [
    { type: 'bricks', dice: '4', probability: '8.333%' },
    { type: 'plains', dice: '3', probability: '5.556%' },
    { type: 'bricks', dice: '8', probability: '13.889%', isRed: true },
    { type: 'stone', dice: '10', probability: '8.333%' }
  ],
  [
    { type: 'stone', dice: '6', probability: '13.889%', isRed: true },
    { type: 'plains', dice: '5', probability: '11.111%' },
    { type: 'desert', dice: '-', probability: '0%' },
    { type: 'wheat', dice: '9', probability: '11.111%' },
    { type: 'plains', dice: '12', probability: '2.778%' }
  ],
  [
    { type: 'bricks', dice: '3', probability: '5.556%' },
    { type: 'forest', dice: '2', probability: '2.778%' },
    { type: 'wheat', dice: '10', probability: '8.333%' },
    { type: 'forest', dice: '11', probability: '5.556%' }
  ],
  [
    { type: 'wheat', dice: '11', probability: '5.556%' },
    { type: 'forest', dice: '4', probability: '2.778%' },
    { type: 'plains', dice: '8', probability: '11.111%', isRed: true }
  ]
];

const shipsData: (ShipData | null)[] = [
  { ratio: '3', resource: 'Dowolne' },
  { ratio: '3', resource: 'Dowolne' },
  { ratio: '2', resource: 'Owce' },
  null,
  null,
  { ratio: '2', resource: 'Gliny' },
  { ratio: '3', resource: 'Dowolne' },
  null,
  null,
  { ratio: '2', resource: 'Drewna' },
  { ratio: '2', resource: 'Rudy' },
  null,
  { ratio: '2', resource: 'Zboża' },
  { ratio: '3', resource: 'Dowolne' }
];

export function CatanMapClient() {
  const [activeTile, setActiveTile] = useState<{
    id: string;
    type: ResourceType;
    stat1: string;
    stat2: string;
    round: number;
    top: number;
    left: number;
  } | null>(null);

  const handleTileClick = (e: React.MouseEvent, type: ResourceType, stat1: string, stat2: string, round: number, id: string) => {
    // If clicking same tile, close
    if (activeTile && activeTile.id === id) {
      setActiveTile(null);
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const popupWidth = 200; // 12.5rem
    const viewportWidth = window.innerWidth;
    
    let left = rect.left + window.scrollX;
    let top = rect.top + window.scrollY - 100;

    if (left + popupWidth > viewportWidth) {
      left = viewportWidth - popupWidth - 10;
    }
    if (left < 0) {
      left = 10;
    }

    setActiveTile({
      id,
      type,
      stat1,
      stat2,
      round,
      top,
      left
    });
  };

  const getDimStyle = (round: number, tileType: ResourceType, isShip: boolean, id: string) => {
    if (!activeTile || activeTile.round !== round) return {};
    
    if (activeTile.type === 'ship') {
      if (isShip) {
        return activeTile.id === id ? {} : { backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5))' };
      } else {
        return { filter: 'brightness(30%)' };
      }
    } else {
      if (isShip) {
        return { backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5))' };
      } else {
        if (activeTile.type === tileType && activeTile.id !== id) {
          return { filter: 'brightness(55%)' };
        } else if (activeTile.id === id) {
          return { filter: 'brightness(100%)' };
        }
        return { filter: 'brightness(30%)' };
      }
    }
  };

  const renderRound = (roundNumber: number, rows: HexagonData[][]) => {
    return (
      <section className="w-full py-5 px-2 flex justify-center items-start flex-wrap mb-12" id={`round-${roundNumber}`}>
        <div className="w-full flex justify-center items-center text-5xl font-bold uppercase tracking-wider mb-8">
          RUNDA&nbsp;<span className="text-[#8DC63F]">{roundNumber}</span>
        </div>

        <div className="relative flex justify-center items-center flex-wrap w-[28.125rem] h-[25rem] sm:w-[28.125rem] sm:h-[25rem] max-w-full font-medium"
             style={{ 
               backgroundImage: 'url(/img/2025/games/catan_icons/normalBackground.webp)', 
               backgroundSize: 'cover', 
               backgroundPosition: 'center',
               width: 'min(100vw - 2rem, 28.125rem)',
               height: 'min((100vw - 2rem) * 0.88, 25rem)'
             }}>
          
          {/* Sea / Ships overlay */}
          <div className="absolute inset-0 z-[5] flex justify-start items-start flex-wrap">
            {shipsData.map((ship, index) => {
              const id = `r${roundNumber}-ship-${index}`;
              const isClickable = ship !== null;
              return (
                <div 
                  key={index}
                  onClick={(e) => isClickable && handleShipClick(e, ship, roundNumber, id)}
                  className={`relative w-1/2 h-[14.28%] z-[6] ${isClickable ? 'cursor-pointer' : ''} transition-all duration-300`}
                  style={getDimStyle(roundNumber, 'ship', true, id)}
                />
              );
            })}
          </div>

          {/* Map Hexagons */}
          <div className="flex justify-center items-center flex-wrap w-[18.75rem] h-[18.75rem] font-medium z-[10] scale-[0.6] sm:scale-100 transition-transform pointer-events-none">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center items-center w-full h-[20%]">
                {row.map((hex, hexIndex) => {
                  const id = `r${roundNumber}-hex-${rowIndex}-${hexIndex}`;
                  return (
                    <div 
                      key={hexIndex}
                      onClick={(e) => handleTileClick(e, hex.type, hex.dice, hex.probability, roundNumber, id)}
                      className="flex justify-center items-center h-20 aspect-[0.866] cursor-pointer text-[#ffefb1] text-xl bg-center transition-all duration-300 shrink-0 pointer-events-auto"
                      style={{
                        clipPath: 'polygon(-50% 50%,50% 100%,150% 50%,50% 0)',
                        backgroundImage: `url(${mapResources[hex.type].bg})`,
                        backgroundSize: 'cover',
                        ...getDimStyle(roundNumber, hex.type, false, id)
                      }}
                    >
                      {hex.type !== 'desert' && (
                        <div className={`w-[30px] h-[30px] bg-[#ffefb1] rounded-full flex items-center justify-center border border-black font-bold text-sm ${hex.isRed ? 'text-red-600' : 'text-black'}`}>
                          {hex.dice}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const handleShipClick = (e: React.MouseEvent, ship: ShipData, round: number, id: string) => {
    handleTileClick(e, 'ship', ship.ratio, ship.resource, round, id);
  };

  return (
    <div className="font-sans text-text-900 bg-bg-100 min-h-screen">
      {renderRound(1, round1Rows)}
      {renderRound(2, round2Rows)}

      <div className="w-full text-center font-medium text-text-600 pb-16">
        Naciśnij na pole zasobu lub statek by zobaczyć szczegóły.
      </div>

      {activeTile && (
        <div 
          className="absolute z-[100] w-[200px] bg-white border border-bg-400 rounded-md shadow-xl flex flex-col p-3 text-black text-sm"
          style={{ top: activeTile.top, left: activeTile.left }}
        >
          <button 
            className="absolute top-2 right-2 text-gray-500 hover:text-black transition-colors"
            onClick={() => setActiveTile(null)}
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="w-full text-center font-bold text-lg mb-2">
            {mapResources[activeTile.type].name}
          </div>

          {activeTile.type === 'ship' ? (
            <div className="text-center font-medium">
              1 Dowolne za {activeTile.stat1} {activeTile.stat2}
            </div>
          ) : (
            <ul className="space-y-1">
              <li>Potrzebne oczka: <span className="font-bold">{activeTile.stat1}</span></li>
              <li>Szansa: <span className="font-bold">{activeTile.stat2}</span></li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

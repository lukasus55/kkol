'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, BarChart2, User } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname() || '';

  let footerBg = "bg-bg-200";
  let iconClass = "text-text-500 hover:text-text-700 hover:bg-bg-400";

  if (pathname.startsWith('/2024')) {
    footerBg = "bg-[#00163a]";
    iconClass = "text-[#8BA8B7] hover:text-[#eaf6ff] hover:bg-[#353f77]";
  } else if (pathname.startsWith('/2025')) {
    footerBg = "bg-[#251706]";
    iconClass = "text-[#F4F5E9]/70 hover:text-[#FBAB18] hover:bg-[#3d270c]";
  } else if (pathname.startsWith('/2026')) {
    footerBg = "bg-[#303238]";
    iconClass = "text-[#94a3b8] hover:text-[#8DC63F] hover:bg-[#474a52]";
  }

  const btnBase = "flex justify-center items-center w-[1.7em] h-[1.7em] rounded-[5pt] transition-all duration-300 opacity-80 mx-[2px] font-semibold cursor-pointer hover:opacity-100 hover:-translate-y-[2px]";

  return (
    <div className="flex fixed flex-row bottom-0 left-0 w-full z-[200] text-[25px] justify-center self-center flex-wrap text-text-900">
      <div className={`flex justify-around md:justify-center flex-row p-0 items-center w-full h-[2.4em] z-[290] transition-colors duration-500 ${footerBg}`}>

        <Link href="/">
          <div className={`${btnBase} ${iconClass}`} title="Strona Główna">
            <Home className="w-[1em] h-[1em]" />
          </div>
        </Link>

        <Link href="/events">
          <div className={`${btnBase} ${iconClass}`} title="Wydarzenia">
            <Trophy className="w-[1em] h-[1em]" />
          </div>
        </Link>

        <Link href="/2026">
          <div
            className="flex justify-center items-center w-[1.7em] h-[1.7em] rounded-[5pt] transition-all duration-300 opacity-80 mx-[2px] font-semibold cursor-pointer text-text-500 hover:opacity-100 hover:-translate-y-[2px] bg-[#0c0a0a] hover:bg-[#181515] relative overflow-hidden group"
            title="Sezon 2026"
          >
            <img src="/img/season_icon.webp" alt="Sezon 2026" className="w-[1.15em] h-[1.15em] relative z-10" />
            <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 group-hover:left-[200%] transition-all duration-700 ease-in-out z-20" />
          </div>
        </Link>

        <Link href="/ranking">
          <div className={`${btnBase} ${iconClass}`} title="Ranking">
            <BarChart2 className="w-[1em] h-[1em]" />
          </div>
        </Link>

        <Link href="/dashboard">
          <div className={`${btnBase} ${iconClass}`} title="Profil">
            <User className="w-[1em] h-[1em]" />
          </div>
        </Link>

      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface Event {
  id: string;
  title: string;
  start: string;
  extendedProps: {
    is_major: boolean;
  };
}

interface CompactCalendarProps {
  primaryColorClass?: string;
  textColorClass?: string;
  secondaryTextColorClass?: string;
  tournamentId: string;
}

export default function CompactCalendar({ tournamentId, primaryColorClass, textColorClass, secondaryTextColorClass }: CompactCalendarProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      if (!tournamentId) return;
      try {
        const response = await fetch(`/api/events?tournament=${tournamentId}`);
        const data = await response.json();
        
        // Sort chronologically
        const sortedData = data.sort((a: Event, b: Event) => new Date(a.start).getTime() - new Date(b.start).getTime());
        setEvents(sortedData);
      } catch (error) {
        console.error("Failed to fetch events", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="w-full flex justify-center py-8">
        <Loader2 className="w-12 h-12 text-dashboard-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto items-center">
      {events.map((e, idx) => {
        if (!e?.title || !e?.start) return null;

        const dateObj = new Date(e.start);
        const month = dateObj.toLocaleString("pl-PL", { month: "short" }).toUpperCase();
        const day = ("0" + dateObj.getDate()).slice(-2);
        const formattedDate = `${day} ${month}`;
        const primaryColor = primaryColorClass || "text-dashboard-primary";
        const txtColor = textColorClass || "text-dashboard-text";
        const secondaryColor = secondaryTextColorClass || "text-dashboard-text-s3";
        const isMajor = e.extendedProps?.is_major !== false; // Default to true if undefined? actually the old code said e.extendedProps.is_major ? '' : 'minor'

        return (
          <div
            key={idx}
            className={`flex w-full gap-8 justify-center ${
              isMajor
                ? "text-[2.5rem] font-black leading-none md:text-[4rem]" // Main event
                : "text-[1.25rem] font-bold leading-none md:text-[1.75rem]" // Minor event
            }`}
          >
            <div className={`flex w-1/4 justify-end min-w-max whitespace-nowrap ${primaryColor}`}>
              {formattedDate}
            </div>
            <div className={`flex w-3/4 ${!isMajor ? secondaryColor : txtColor}`}>
              {e.title}
            </div>
          </div>
        );
      })}
    </div>
  );
}

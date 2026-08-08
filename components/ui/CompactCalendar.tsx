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
  tournamentId: string;
}

export default function CompactCalendar({ tournamentId }: CompactCalendarProps) {
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
        const isMajor = e.extendedProps?.is_major !== false; // Default to true if undefined? actually the old code said e.extendedProps.is_major ? '' : 'minor'

        return (
          <div
            key={idx}
            className={`flex w-full gap-8 justify-center ${
              isMajor
                ? "text-[3.75rem] font-black leading-none md:text-[6rem]" // Main event
                : "text-[1.75rem] font-bold leading-none md:text-[2.5rem]" // Minor event
            }`}
          >
            <div className="flex w-1/4 justify-end text-dashboard-primary">
              {formattedDate}
            </div>
            <div className={`flex w-3/4 ${!isMajor ? "text-dashboard-text-s3" : "text-dashboard-text"}`}>
              {e.title}
            </div>
          </div>
        );
      })}
    </div>
  );
}

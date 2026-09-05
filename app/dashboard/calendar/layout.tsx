'use client';

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full w-full bg-bg-100 overflow-hidden">
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

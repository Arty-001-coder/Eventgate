"use client";

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import eventsData from '../../admin/events.json';
import { Calendar as CalendarIcon, MapPin, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

const NUM_ORANGE_DOTS = 27;

gsap.registerPlugin(useGSAP);

export default function CalendarPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State for Navigation
  const [currentDate, setCurrentDate] = React.useState(new Date(2024, 9, 15)); // Start at Oct 2024
  const [selectedDay, setSelectedDay] = React.useState<number>(15);
  const [dots, setDots] = React.useState<{id: number, isOrange: boolean}[]>([]);

  // Background Dots Effect
  React.useEffect(() => {
    const TOTAL_DOTS = 400;
    const orangeIndices = new Set<number>();
    while(orangeIndices.size < NUM_ORANGE_DOTS) {
        orangeIndices.add(Math.floor(Math.random() * TOTAL_DOTS));
    }
    const newDots = Array.from({ length: TOTAL_DOTS }).map((_, i) => ({
        id: i,
        isOrange: orangeIndices.has(i)
    }));
    setDots(newDots);
  }, []);

  // Animations
  useGSAP(() => {
    gsap.fromTo(".anim-header", 
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power2.out", clearProps: "all" }
    );
    gsap.fromTo(".anim-calendar", 
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: "power2.out", delay: 0.2, clearProps: "all" }
    );
  }, { scope: containerRef });

  // Pop Animation on Date Change
  useGSAP(() => {
      if (filteredEvents.length > 0) {
        gsap.fromTo(".anim-event-card",
            { scale: 0.9, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.4, stagger: 0.1, ease: "back.out(1.7)", clearProps: "all" }
        );
      } else {
        // Animate the "No events" card too
        gsap.fromTo(".anim-event-card",
            { scale: 0.9, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)", clearProps: "all" }
        );
      }
  }, { dependencies: [selectedDay, currentDate], scope: containerRef });

  // Calendar Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOffset = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon...
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: startDayOffset }, (_, i) => i);

  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const currentMonthName = monthNames[month];

  // Navigation Handlers
  const handlePrevMonth = () => {
      setCurrentDate(new Date(year, month - 1, 1));
      setSelectedDay(1); // Reset selection
  };
  const handleNextMonth = () => {
      setCurrentDate(new Date(year, month + 1, 1));
      setSelectedDay(1); // Reset selection
  };

  // Filter Events
  // Assuming "Oct 15" format. We need to match Month Name and Day.
  // Ideally, JSON dates should be ISO. But we work with "Oct 15".
  const filteredEvents = eventsData.rolledEvents.filter(e => {
      const [eMonth, eDay] = e.date.split(' '); // ["Oct", "15"]
      // Simple case-insensitive match for demo: "Oct" vs "OCT"
      const isSameMonth = eMonth.toUpperCase().startsWith(currentMonthName); 
      // Note: "SEPT" vs "SEP" might be an issue, stick to 3 chars for now or robust parsing
      // Let's assume JSON matches standard 3-char months for simplicity
      
      return isSameMonth && parseInt(eDay) === selectedDay;
  });

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
        
       {/* Background Dots */}
       <div className="absolute inset-0 z-0 grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] gap-4 p-8 pointer-events-none opacity-40">
          {dots.map(dot => (
              <div 
                  key={dot.id} 
                  className={`w-1 h-1 rounded-full transition-colors duration-1000 ${
                      dot.isOrange 
                          ? 'bg-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.8)] opacity-100' 
                          : 'bg-white opacity-20'
                  }`}
              ></div>
          ))}
      </div>

      <header className="anim-header w-full px-8 py-6 flex items-center justify-between relative z-10">
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase flex items-center gap-4">
              <CalendarIcon className="text-orange-600" />
              EVENT CALENDAR
          </h1>
      </header>


      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 h-full relative z-10">
          
          {/* Left: Custom Calendar */}
          <div className="p-12 md:p-16 flex flex-col justify-center border-r border-white/10">
              <div className="max-w-md w-full mx-auto">
                 {/* Month Navigation (Moved Here) */}
                 <div className="flex items-center justify-between mb-8">
                     <h2 className="text-xl font-bold tracking-widest text-black bg-white px-6 py-2 rounded-full">{currentMonthName} {year}</h2>
                     <div className="flex items-center gap-2">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
                            <ChevronRight size={20} />
                        </button>
                     </div>
                 </div>

                 {/* Weekday Headers */}
                 <div className="grid grid-cols-7 mb-4 text-center">
                     {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                         <div key={d} className="anim-calendar text-xs font-bold text-gray-500 tracking-widest py-2">
                             {d}
                         </div>
                     ))}
                 </div>

                 {/* Days Grid */}
                 <div className="grid grid-cols-7 gap-4">
                     {/* Blanks */}
                     {blanks.map(b => (
                         <div key={`blank-${b}`} className="aspect-square"></div>
                     ))}
                     
                     {/* Dates */}
                     {days.map(day => {
                         const isActive = day === selectedDay;
                         // Check if events exist for this day in CURRENT month
                         const hasEvents = eventsData.rolledEvents.some(e => {
                             const [eMonth, eDay] = e.date.split(' ');
                             return eMonth.toUpperCase().startsWith(currentMonthName) && parseInt(eDay) === day;
                         });

                         return (
                             <button 
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`anim-calendar aspect-square flex flex-col items-center justify-center rounded-xl text-lg font-bold transition-all relative group
                                    ${isActive 
                                        ? 'bg-orange-600 text-black scale-110 shadow-[0_0_20px_rgba(234,88,12,0.4)]' 
                                        : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'
                                    }
                                `}
                             >
                                 {day}
                                 {hasEvents && !isActive && (
                                     <span className="w-1 h-1 bg-orange-600 rounded-full mt-1"></span>
                                 )}
                             </button>
                         )
                     })}
                 </div>
              </div>
          </div>


          {/* Right: Events List */}
          <div className="p-8 md:p-12 h-screen max-h-screen overflow-hidden flex flex-col">
               <div className="anim-event-card mb-8">
                   <h2 className="text-4xl font-bold mb-2">EVENTS</h2>
                   <p className="text-gray-500">Scheduled for {currentMonthName} {selectedDay}, {year}</p>
               </div>

               <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar pb-20">
                   {filteredEvents.length > 0 ? (
                       filteredEvents.map((event) => (
                           <div key={event.id} className="anim-event-card p-6 bg-black border border-white rounded-xl hover:border-orange-600 transition-colors group">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-3xl font-bold text-orange-600 uppercase">
                                        {event.club}
                                    </span>
                                     <span className="text-3xl font-bold tracking-tighter text-white flex items-center gap-2">
                                         {event.time} <ArrowRight className="text-orange-600" size={24} strokeWidth={3} /> {event.endTime}
                                     </span>
                                </div>
                                
                                <h3 className="text-2xl font-bold mb-2 group-hover:text-orange-500 transition-colors">
                                    {event.event}
                                </h3>
                                
                                <p className="text-gray-400 text-sm mb-6 line-clamp-2">
                                    {event.desc}
                                </p>

                                <div className="flex items-center gap-6 text-xs font-bold tracking-wide text-gray-300">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-orange-600" />
                                        {event.venue}
                                    </div>
                                </div>
                           </div>
                       ))
                   ) : (
                       <div className="anim-event-card p-12 border border-dashed border-white/20 rounded-xl text-center text-gray-500">
                           <p>No events scheduled for this date.</p>
                       </div>
                   )}
               </div>
          </div>

      </main>
    </div>
  );
}

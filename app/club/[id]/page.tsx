"use client";

import React, { useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Calendar, Users } from 'lucide-react';

const NUM_ORANGE_DOTS = 27;

gsap.registerPlugin(useGSAP);

type EventLog = {
  id: number;
  eventName: string;
  description: string;
  date: string;
  time: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
};

export default function ClubPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dots, setDots] = React.useState<{id: number, isOrange: boolean}[]>([]);
  
  // Form state
  const [formData, setFormData] = React.useState({
    eventName: '',
    startTime: '',
    endTime: '',
    date: '',
    description: ''
  });
  
  // Event logs state - combine dummy data with new events
  const [eventLogs, setEventLogs] = React.useState<EventLog[]>(() => {
    // Initialize with dummy data
    return Array.from({ length: 12 }, (_, i) => {
      const item = i + 1;
      const status = item % 3 === 0 ? 'REJECTED' : item % 3 === 1 ? 'APPROVED' : 'PENDING';
      return {
        id: item,
        eventName: `Coding Workshop ${item}`,
        description: 'Introduction to advanced React patterns and performance optimization techniques.',
        date: `OCT ${10 + item}`,
        time: '10:00 AM',
        status: status as 'PENDING' | 'APPROVED' | 'REJECTED'
      };
    });
  });
  
  const [nextEventId, setNextEventId] = React.useState(13);

  React.useEffect(() => {
    // Generate a grid of dots (e.g., roughly enough to cover screen)
    // We'll use a fixed large number to ensure coverage, or calculate based on window
    const TOTAL_DOTS = 400; // 20x20 roughly
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

  // Entrance Animations
  useGSAP(() => {
    // Top Bar Fade In
    gsap.fromTo(".anim-header", 
      { y: -20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
        clearProps: "all"
      }
    );

    // Form Elements Stagger
    gsap.fromTo(".anim-form", 
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.2,
        clearProps: "all"
      }
    );

    // Right Panel Stagger
    gsap.fromTo(".anim-logs", 
      { x: 20, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.4,
        clearProps: "all"
      }
    );

  }, { scope: containerRef });

  // Animate newly added events
  useGSAP(() => {
    if (eventLogs.length > 0) {
      gsap.fromTo(".anim-new-event", 
        { scale: 0.9, opacity: 0, y: 20 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "back.out(1.7)",
          clearProps: "all"
        }
      );
    }
  }, { scope: containerRef, dependencies: [eventLogs.length] });

  // Format date from YYYY-MM-DD to "Oct 15" format
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${monthNames[date.getMonth()]} ${date.getDate()}`;
  };

  // Format time from HH:MM to "10:00 AM" format
  const formatTime = (timeString: string): string => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.eventName || !formData.date || !formData.startTime || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    // Create new event log
    const newEvent: EventLog = {
      id: nextEventId,
      eventName: formData.eventName,
      description: formData.description,
      date: formatDate(formData.date),
      time: formatTime(formData.startTime),
      status: 'PENDING'
    };

    // Add to local state immediately
    setEventLogs(prev => [newEvent, ...prev]);
    setNextEventId(prev => prev + 1);

    // Prepare event data for API (for events.json)
    const eventForAPI = {
      id: nextEventId,
      club: resolvedParams.id,
      event: formData.eventName,
      date: formatDate(formData.date),
      time: formatTime(formData.startTime),
      venue: 'TBD', // Default venue, can be added to form later
      desc: formData.description
    };

    // Save to events.json via API
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventForAPI),
      });

      if (!response.ok) {
        console.error('Failed to save event to events.json');
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }

    // Reset form
    setFormData({
      eventName: '',
      startTime: '',
      endTime: '',
      date: '',
      description: ''
    });
  };

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

      {/* 1. Header Row */}
      <header className="anim-header w-full px-8 py-6 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-8">
              {/* Roll Number */}
              <div className="px-5 py-2 bg-white rounded-full text-xs font-bold font-mono tracking-widest text-black">
                  IMS22415
              </div>
              {/* Club Name */}
              <h1 className="text-2xl font-bold tracking-tight text-white uppercase">
                  {resolvedParams.id}
              </h1>
          </div>

          <button className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold rounded-xl transition-colors tracking-wide">
              <Users size={16} />
              CONNECTIONS
          </button>
      </header>


      {/* Main Content Split */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 h-full relative z-10">
          
          {/* 2. Left Panel: Create Event Form */}
          <div className="p-12 md:p-16 flex flex-col justify-center border-r border-white/10 relative">
              <div className="max-w-xl w-full mx-auto space-y-12">
                  <div className="anim-form">
                      <h2 className="text-4xl font-bold mb-2">CREATE EVENT</h2>
                      <p className="text-gray-500">Fill in the details to request a new event.</p>
                  </div>

                  {/* Form Fields */}
                  <form onSubmit={handleSubmit} className="space-y-8">
                       {/* Event Name */}
                       <div className="anim-form group">
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest group-focus-within:text-orange-600 transition-colors">Event Name</label>
                            <input 
                                type="text" 
                                name="eventName"
                                value={formData.eventName}
                                onChange={handleInputChange}
                                placeholder="e.g. Hackathon 2024" 
                                className="w-full bg-transparent border-b border-white py-3 text-xl focus:border-orange-600 outline-none transition-colors placeholder:text-gray-700 font-medium"
                                required
                            />
                       </div>

                       {/* Time Row */}
                       <div className="anim-form grid grid-cols-2 gap-8">
                            <div className="group">
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest group-focus-within:text-orange-600 transition-colors">Start Time</label>
                                <input 
                                    type="time" 
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleInputChange}
                                    className="w-full bg-transparent border-b border-white py-3 text-xl focus:border-orange-600 outline-none transition-colors font-medium text-white scheme:dark"
                                    required
                                />
                            </div>
                            <div className="group">
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest group-focus-within:text-orange-600 transition-colors">End Time</label>
                                <input 
                                    type="time" 
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleInputChange}
                                    className="w-full bg-transparent border-b border-white py-3 text-xl focus:border-orange-600 outline-none transition-colors font-medium text-white scheme:dark"
                                />
                            </div>
                       </div>

                       {/* Date */}
                       <div className="anim-form group">
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest group-focus-within:text-orange-600 transition-colors">Date</label>
                            <input 
                                type="date" 
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                className="w-full bg-transparent border-b border-white py-3 text-xl focus:border-orange-600 outline-none transition-colors font-medium text-white scheme:dark"
                                required
                            />
                       </div>

                       {/* Description */}
                       <div className="anim-form group">
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest group-focus-within:text-orange-600 transition-colors">Description</label>
                            <textarea 
                                rows={3}
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Describe the event details..."
                                className="w-full bg-transparent border border-white rounded-xl p-4 text-lg focus:border-orange-600 outline-none transition-colors placeholder:text-gray-700 font-medium resize-none"
                                required
                            ></textarea>
                       </div>

                       {/* Submit Button */}
                       <div className="anim-form pt-4">
                           <button 
                               type="submit"
                               className="w-full py-4 bg-black border border-white text-white rounded-xl font-bold text-sm tracking-widest hover:bg-white hover:text-black transition-all duration-300"
                           >
                               PUBLISH EVENT REQUEST
                           </button>
                       </div>
                  </form>
              </div>
          </div>


          {/* 3. Right Panel: Event Logs */}
          <div className="p-8 md:p-12 h-full flex flex-col">
             <div className="bg-linear-to-br from-white/5 via-black to-white/5 rounded-2xl p-10 flex flex-col relative overflow-hidden border border-white/7 h-[800px]">
                 <div className="absolute top-0 right-0 p-12">
                    <div className="w-32 h-32 bg-orange-600/20 blur-[80px] rounded-full point-events-none"></div>
                 </div>

                 <div className="anim-logs flex items-center justify-between mb-10 relative z-10">
                     <h2 className="text-2xl font-bold tracking-widest flex items-center gap-3">
                         <span className="w-2 h-8 bg-orange-600 block"></span>
                         EVENT LOGS
                     </h2>
                     <span className="text-gray-500 text-sm">Recent Activity</span>
                 </div>

                 {/* Logs List Container */}
                 <div className="flex-1 overflow-y-auto pr-4 space-y-4 custom-scrollbar relative z-10">
                     {/* Event Log Items */}
                     {eventLogs.map((event, index) => (
                         <div key={event.id} className={`${index === 0 ? 'anim-new-event' : 'anim-logs'} p-6 bg-linear-to-br from-white/5 via-black to-white/5 rounded-2xl border border-white/5 hover:border-orange-600 transition-all group`}>
                             <div className="flex justify-between items-start mb-2">
                                 <h3 className="font-bold text-lg group-hover:text-orange-500 transition-colors">{event.eventName}</h3>
                                 <span className={`text-xs px-3 py-1 rounded font-bold tracking-wider ${
                                     event.status === 'APPROVED' ? 'bg-orange-600 text-white' : 
                                     event.status === 'REJECTED' ? 'bg-white text-black' : 
                                     'bg-black text-white border border-white'
                                 }`}>
                                     {event.status}
                                 </span>
                             </div>
                             <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                                 {event.description}
                             </p>
                             <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
                                 <span>{event.date}</span>
                                 <span>•</span>
                                 <span>{event.time}</span>
                             </div>
                         </div>
                     ))}
                 </div>

                 {/* Footer Actions */}
                 <div className="anim-logs mt-8 pt-6 border-t border-white/10 flex justify-end relative z-10">
                     <button 
                         onClick={() => router.push('/club/calender')}
                         className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                     >
                         <Calendar size={18} />
                         OPEN CALENDAR
                     </button>
                 </div>
             </div>
          </div>

      </main>

    </div>
  );
}

"use client";
import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Eye, EyeOff, ChevronRight, ArrowLeft, Grip, X } from 'lucide-react';

gsap.registerPlugin(useGSAP);

export default function Page() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'clubs' | 'admin'>('clubs');
  /* State for Navigation */
  const [clubView, setClubView] = useState<'menu' | 'join' | 'create' | 'status'>('menu');
  const [adminView, setAdminView] = useState<'intro' | 'select-club' | 'auth-method' | 'existing-admin' | 'new-admin'>('intro');
  const [showSecret, setShowSecret] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [clubNameInput, setClubNameInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  /* State for Status Toggle */
  const [statusMode, setStatusMode] = useState<'creation' | 'joining'>('creation');

  /* State for Create Network Multi-step Form */
  const [createStep, setCreateStep] = useState(1);
  const [createData, setCreateData] = useState({
    creatorName: '',
    creatorIMS: '',
    clubName: '',
    clubSecret: '',
    confirmSecret: ''
  });
  const [showConfirmSecret, setShowConfirmSecret] = useState(false);

  const handleCreateNext = () => {
    if (createStep < 3) {
      setCreateStep(prev => prev + 1);
    }
  };

  useGSAP(() => {
    // Standard page load animations (Images and Dots only)
    gsap.from(".anim-image", {
      scale: 0.9,
      opacity: 0,
      duration: 1,
      ease: "power2.out"
    });

    gsap.from(".anim-dot", {
      scale: 0,
      opacity: 0,
      duration: 0.6,
      stagger: {
        amount: 0.5,
        from: "random"
      },
      ease: "back.out(1.7)",
      delay: 0.3
    });
  }, { scope: containerRef, dependencies: [activeTab] });

  useGSAP(() => {
      // Handle Menu Text vs Forms (Join/Status)
      if (['join', 'status'].includes(clubView)) {
          gsap.from(".anim-form", {
              y: 20,
              opacity: 0,
              duration: 0.6,
              stagger: 0.1,
              ease: "power2.out"
          });
      } else if (clubView === 'menu') {
          gsap.from(".anim-text", {
              y: 30,
              opacity: 0,
              duration: 0.8,
              stagger: 0.1,
              ease: "power3.out",
              delay: 0.1
          });
      }
      
      // Admin Views Animation
      if (['select-club', 'auth-method', 'existing-admin', 'new-admin'].includes(adminView)) {
        gsap.from(".anim-admin-form", {
            y: 20,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out"
        });
      }
  }, { scope: containerRef, dependencies: [clubView, adminView] });

  // Handle Create Network Wizard Animations
  useGSAP(() => {
    if (clubView === 'create') {
       gsap.from(".anim-form", {
          y: 20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out"
       });
    }
  }, { scope: containerRef, dependencies: [clubView, createStep] });

  // Handle Status Mode Animations
  useGSAP(() => {
    if (clubView === 'status') {
       gsap.from(".anim-status-input", {
          y: 20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out"
       });
    }
  }, { scope: containerRef, dependencies: [clubView, statusMode] });

  // Credits Animation
  useGSAP(() => {
    if (showCredits) {
       gsap.from(".anim-credit-item", {
          y: 30,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          delay: 0.1
       });
    }
  }, { scope: containerRef, dependencies: [showCredits] });
  
  const handleMenuClick = (item: string) => {
    if (item === 'Join network') setClubView('join');
    if (item === 'Create network') {
        setCreateStep(1);
        setClubView('create');
    }
    if (item === 'Request status') setClubView('status');
  };

  return (
    <div ref={containerRef} className={`min-h-screen transition-colors duration-500 ${activeTab === 'clubs' ? 'bg-black text-white' : 'bg-white text-black'}`}>
      {/* Header */}
      <header className="fixed top-7 left-0 right-0 z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl md:text-3xl font-bold tracking-tight">
            Event<span className="text-orange-600">Gate</span>
          </div>

          <nav className="flex items-center gap-6 md:gap-8 text-sm font-medium absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
            <button 
              onClick={() => { setActiveTab('clubs'); setClubView('menu'); }}
              className={`pb-1 transition-all duration-300 ${
                activeTab === 'clubs' 
                  ? 'border-b-2 border-orange-600 font-bold text-lg' 
                  : 'hover:text-gray-600 text-gray-500'
              }`}
            >
              CLUBS
            </button>
            <button 
              onClick={() => setActiveTab('admin')}
              className={`pb-1 transition-all duration-300 ${
                activeTab === 'admin' 
                  ? 'border-b-2 border-orange-600 font-bold text-lg' 
                  : 'hover:text-gray-600 text-gray-500'
              }`}
            >
              ADMIN
            </button>
          </nav>

          {/* Credits Trigger */}
          <button 
             onClick={() => setShowCredits(true)}
             className={`p-2 rounded-full transition-colors ${
                 activeTab === 'clubs' ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-black'
             }`}
          >
              <Grip size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {/* If Admin Tab is active -> Show Section 1 (Admin Style) */}
      {activeTab === 'admin' && (
        <section className="relative bg-white pt-32 pb-20 px-6 overflow-hidden min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            {/* Admin Image */}
            <div className="relative">
              <div className="anim-image">
                <Image
                  src="/landingPage/admin.png"
                  alt="Admin illustration"
                  width={600}
                  height={600}
                  className="w-full h-auto"
                  priority
                />
              </div>
              {/* Decorative orange dots */}
              <div className="anim-dot absolute top-12 left-12 w-3 h-3 bg-orange-600 rounded-full"></div>
              <div className="anim-dot absolute top-32 left-4 w-2.5 h-2.5 bg-orange-600 rounded-full"></div>
              <div className="anim-dot absolute top-24 right-12 w-3 h-3 bg-orange-600 rounded-full"></div>
              <div className="anim-dot absolute top-40 right-24 w-2 h-2 bg-orange-600 rounded-full"></div>
              <div className="anim-dot absolute bottom-32 left-32 w-2.5 h-2.5 bg-orange-600 rounded-full"></div>
              <div className="anim-dot absolute bottom-20 right-8 w-3 h-3 bg-orange-600 rounded-full"></div>
            </div>

            {/* Content */}
            {/* Content */}
            <div className="space-y-6 ">
              {adminView === 'intro' ? (
                <>
                  <h2 className="anim-text text-5xl md:text-6xl font-bold tracking-tight">ADMIN PORTAL</h2>
                  <p className="anim-text text-gray-600 leading-relaxed ml-7">
                    This is the portal to access the Admin page. Click on
                    <br />
                    the button below to proceed with the authentication
                  </p>
                  <div className="anim-text ml-5">
                    <button 
                      onClick={() => setAdminView('select-club')}
                      className="px-43 py-3 border-2 border-black text-sm font-medium tracking-wide hover:bg-black hover:text-white transition-colors"
                    >
                      ENTER
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full max-w-md ml-5">
                  <button 
                      onClick={() => setAdminView('intro')}
                      className="anim-admin-form mb-8 text-gray-500 hover:text-black transition-colors flex items-center gap-2"
                  >
                      <ArrowLeft size={20} />
                      <span className="text-sm tracking-wide">HOME</span>
                  </button>

                  <div className="space-y-6">
                    {/* SELECT CLUB VIEW */}
                    {adminView === 'select-club' && (
                       <>
                         <div className="anim-admin-form group">
                             <label className="block text-sm font-medium text-gray-600 mb-2">SELECT COUNCIL</label>
                             <select className="w-full bg-transparent border-b border-black py-2 text-lg focus:border-orange-500 outline-none transition-colors text-black appearance-none rounded-none">
                               <option value="STC">STC</option>
                             </select>
                         </div>
                         <div className="anim-admin-form pt-8 flex gap-4">
                            <button 
                                onClick={() => setAdminView('intro')}
                                className="w-1/3 py-3 border border-black text-black hover:bg-black hover:text-white transition-all duration-300 text-sm font-bold tracking-wide"
                            >
                                BACK
                            </button>
                            <button 
                                onClick={() => setAdminView('auth-method')}
                                className="w-2/3 py-3 bg-black border border-black text-white hover:bg-white hover:text-black transition-all duration-300 text-sm font-bold tracking-wide"
                            >
                                NEXT
                            </button>
                         </div>
                       </>
                    )}

                    {/* AUTH METHOD VIEW */}
                    {adminView === 'auth-method' && (
                       <div className="space-y-8 pt-4">
                          <div 
                            onClick={() => setAdminView('existing-admin')}
                            className="anim-admin-form flex items-center gap-4 cursor-pointer group"
                          >
                             <div className="w-2.5 h-2.5 bg-orange-600 rounded-full"></div>
                             <span className="text-xl font-semibold text-black border-b border-transparent group-hover:border-black transition-all">Existing Admin</span>
                          </div>
                          <div 
                            onClick={() => setAdminView('new-admin')}
                            className="anim-admin-form flex items-center gap-4 cursor-pointer group"
                          >
                             <div className="w-2.5 h-2.5 bg-orange-600 rounded-full"></div>
                             <span className="text-xl font-semibold text-black border-b border-transparent group-hover:border-black transition-all">New Admin</span>
                          </div>
                          <div className="anim-admin-form pt-4">
                             <button 
                                 onClick={() => setAdminView('select-club')}
                                 className="w-1/3 py-3 border border-black text-black hover:bg-black hover:text-white transition-all duration-300 text-sm font-bold tracking-wide"
                             >
                                 BACK
                             </button>
                          </div>
                       </div>
                    )}

                    {/* EXISTING ADMIN VIEW */}
                    {adminView === 'existing-admin' && (
                        <>
                            <div className="anim-admin-form group">
                                <input 
                                    type="text" 
                                    placeholder="IMS" 
                                    className="w-full bg-transparent border-b border-black py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 text-black"
                                />
                            </div>
                            <div className="anim-admin-form group relative">
                                <input 
                                    type={showSecret ? "text" : "password"} 
                                    placeholder="Password" 
                                    className="w-full bg-transparent border-b border-black py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 tracking-widest text-black"
                                />
                                <button 
                                    onClick={() => setShowSecret(!showSecret)}
                                    className="absolute right-2 top-2 text-gray-400 hover:text-black transition-colors"
                                >
                                    {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <div className="anim-admin-form pt-8 flex gap-4">
                                <button 
                                    onClick={() => setAdminView('auth-method')}
                                    className="w-1/3 py-3 border border-black text-black hover:bg-black hover:text-white transition-all duration-300 text-sm font-bold tracking-wide"
                                >
                                    BACK
                                </button>
                                <button className="w-2/3 py-3 bg-black border border-black text-white hover:bg-white hover:text-black transition-all duration-300 text-sm font-bold tracking-wide" onClick={() => router.push('/admin')}>
                                    ACCESS ADMIN PAGE
                                </button>
                            </div>
                        </>
                    )}

                    {/* NEW ADMIN VIEW */}
                    {adminView === 'new-admin' && (
                        <>
                            <div className="anim-admin-form group">
                                <input 
                                    type="text" 
                                    placeholder="Name" 
                                    className="w-full bg-transparent border-b border-black py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 text-black"
                                />
                            </div>
                            <div className="anim-admin-form group">
                                <input 
                                    type="text" 
                                    placeholder="IMS" 
                                    className="w-full bg-transparent border-b border-black py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 text-black"
                                />
                            </div>
                            <div className="anim-admin-form pt-8 flex gap-4">
                                <button 
                                    onClick={() => setAdminView('auth-method')}
                                    className="w-1/3 py-3 border border-black text-black hover:bg-black hover:text-white transition-all duration-300 text-sm font-bold tracking-wide"
                                >
                                    BACK
                                </button>
                                <button className="w-2/3 py-3 bg-black border border-black text-white hover:bg-white hover:text-black transition-all duration-300 text-sm font-bold tracking-wide">
                                    SEND ACCESS REQUEST
                                </button>
                            </div>
                        </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* If Clubs Tab is active -> Show Section 2 (Clubs Style) */}
      {activeTab === 'clubs' && (
        <section className="relative bg-black text-white pt-32 pb-20 px-6 overflow-hidden min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-6 h-full flex flex-col justify-center order-2 md:order-1">
              
              {clubView === 'menu' ? (
                <>
                  <h2 className="anim-text text-5xl md:text-6xl font-bold tracking-tight">CLUB NETWORKS</h2>
                  <div className="space-y-4 pt-4 ml-18">
                      {['Join network', 'Create network', 'Request status'].map((item, index) => (
                      <div 
                          key={index} 
                          onClick={() => handleMenuClick(item)}
                          className="anim-text group flex items-center gap-4 cursor-pointer"
                      >
                          <ChevronRight className="text-orange-600 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                          <span className="text-xl md:text-2xl font-light hover:text-gray-300 transition-colors">{item}</span>
                      </div>
                      ))}
                  </div>
                </>
              ) : (
                <div className="w-full max-w-md">
                    <button 
                        onClick={() => setClubView('menu')}
                        className="anim-form mb-8 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft size={20} />
                        <span className="text-sm tracking-wide">HOME</span>
                    </button>

                    <div className="space-y-6">
                        {/* JOIN NETWORK FORM */}
                        {clubView === 'join' && (
                          <>
                            <div className="anim-form group">
                                <input 
                                    type="text" 
                                    placeholder="Name" 
                                    value={clubNameInput}
                                    onChange={(e) => setClubNameInput(e.target.value)}
                                    className="w-full bg-transparent border-b border-white py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 text-white"
                                />
                            </div>
                            <div className="anim-form group">
                                <input 
                                    type="text" 
                                    placeholder="IMS" 
                                    className="w-full bg-transparent border-b border-white py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 text-white"
                                />
                            </div>
                            <div className="anim-form group relative">
                                <input 
                                    type={showSecret ? "text" : "password"} 
                                    placeholder="Club Secret" 
                                    className="w-full bg-transparent border-b border-white py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 tracking-widest text-white"
                                />
                                <button 
                                    onClick={() => setShowSecret(!showSecret)}
                                    className="absolute right-2 top-2 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <div className="anim-form pt-4">
                                <button className="w-full py-3 bg-orange-600 border border-orange-600 rounded text-white shadow-[0_0_15px_rgba(234,88,12,0.5)] hover:shadow-[0_0_25px_rgba(234,88,12,0.8)] hover:bg-orange-500 transition-all duration-300 text-sm font-bold tracking-wide" onClick={() => router.push(`/club/${clubNameInput}`)}>
                                    ACCESS NETWORK
                                </button>
                            </div>
                          </>
                        )}

                        {/* CREATE NETWORK FORM */}
                        {clubView === 'create' && (
                          <>
                            {/* STEP 1: Creator Details */}
                            {createStep === 1 && (
                                <>
                                    <div className="anim-form group">
                                        <input 
                                            type="text" 
                                            placeholder="Creator Name" 
                                            value={createData.creatorName}
                                            onChange={(e) => setCreateData({...createData, creatorName: e.target.value})}
                                            className="w-full bg-transparent border-b border-white py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 text-white"
                                        />
                                    </div>
                                    <div className="anim-form group">
                                        <input 
                                            type="text" 
                                            placeholder="Creator IMS" 
                                            value={createData.creatorIMS}
                                            onChange={(e) => setCreateData({...createData, creatorIMS: e.target.value})}
                                            className="w-full bg-transparent border-b border-white py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 text-white"
                                        />
                                    </div>
                                    <div className="anim-form pt-4">
                                        <button 
                                            onClick={handleCreateNext}
                                            disabled={!createData.creatorName || !createData.creatorIMS}
                                            className="w-full py-3 bg-orange-600 border border-orange-600 rounded text-white shadow-[0_0_15px_rgba(234,88,12,0.5)] hover:shadow-[0_0_25px_rgba(234,88,12,0.8)] hover:bg-orange-500 transition-all duration-300 text-sm font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            NEXT
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* STEP 2: Club Details */}
                            {createStep === 2 && (
                                <>
                                    <div className="anim-form group">
                                        <input 
                                            type="text" 
                                            placeholder="Club Name" 
                                            value={createData.clubName}
                                            onChange={(e) => setCreateData({...createData, clubName: e.target.value})}
                                            className="w-full bg-transparent border-b border-white py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 text-white"
                                        />
                                    </div>
                                    <div className="anim-form group relative">
                                        <input 
                                            type={showSecret ? "text" : "password"} 
                                            placeholder="Club Secret" 
                                            value={createData.clubSecret}
                                            onChange={(e) => setCreateData({...createData, clubSecret: e.target.value})}
                                            className="w-full bg-transparent border-b border-white py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 tracking-widest text-white"
                                        />
                                        <button 
                                            onClick={() => setShowSecret(!showSecret)}
                                            className="absolute right-2 top-2 text-gray-500 hover:text-white transition-colors"
                                        >
                                            {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    <div className="anim-form pt-4 flex gap-4">
                                        <button 
                                            onClick={() => setCreateStep(1)}
                                            className="w-1/3 py-3 border border-gray-500 rounded text-gray-300 hover:text-white hover:border-white transition-all duration-300 text-sm font-bold tracking-wide"
                                        >
                                            BACK
                                        </button>
                                        <button 
                                            onClick={handleCreateNext}
                                            disabled={!createData.clubName || !createData.clubSecret}
                                            className="w-2/3 py-3 bg-orange-600 border border-orange-600 rounded text-white shadow-[0_0_15px_rgba(234,88,12,0.5)] hover:shadow-[0_0_25px_rgba(234,88,12,0.8)] hover:bg-orange-500 transition-all duration-300 text-sm font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            NEXT
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* STEP 3: Confirm Secret */}
                            {createStep === 3 && (
                                <>
                                     <div className="anim-form group relative">
                                        <input 
                                            type={showConfirmSecret ? "text" : "password"} 
                                            placeholder="Confirm Secret" 
                                            value={createData.confirmSecret}
                                            onChange={(e) => setCreateData({...createData, confirmSecret: e.target.value})}
                                            className={`w-full bg-transparent border-b py-2 text-lg outline-none transition-colors placeholder:text-gray-500 tracking-widest text-white ${
                                                createData.confirmSecret && createData.clubSecret !== createData.confirmSecret ? 'border-red-500' : 'border-white focus:border-orange-500'
                                            }`}
                                        />
                                        <button 
                                            onClick={() => setShowConfirmSecret(!showConfirmSecret)}
                                            className="absolute right-2 top-2 text-gray-500 hover:text-white transition-colors"
                                        >
                                            {showConfirmSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    
                                    <div className="anim-form pt-4 flex gap-4">
                                        <button 
                                            onClick={() => setCreateStep(2)}
                                            className="w-1/3 py-3 border border-gray-500 rounded text-gray-300 hover:text-white hover:border-white transition-all duration-300 text-sm font-bold tracking-wide"
                                        >
                                            BACK
                                        </button>
                                        <button 
                                            disabled={!createData.confirmSecret || createData.clubSecret !== createData.confirmSecret}
                                            className="w-2/3 py-3 bg-orange-600 border border-orange-600 rounded text-white shadow-[0_0_15px_rgba(234,88,12,0.5)] hover:shadow-[0_0_25px_rgba(234,88,12,0.8)] hover:bg-orange-500 transition-all duration-300 text-sm font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            GENERATE CREATION REQUEST
                                        </button>
                                    </div>
                                </>
                            )}
                          </>
                        )}

                        {/* STATUS FORM */}
                        {clubView === 'status' && (
                          <>
                             {/* Status Toggle */}
                            <div className="anim-form flex gap-8 mb-8 border-b border-gray-800 pb-2 justify-center">
                                <button 
                                    onClick={() => setStatusMode('creation')}
                                    className={`text-sm tracking-wider pb-2 transition-all duration-300 ${
                                        statusMode === 'creation' 
                                            ? 'text-white border-b border-orange-600' 
                                            : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    CLUB CREATION
                                </button>
                                <button 
                                    onClick={() => setStatusMode('joining')}
                                    className={`text-sm tracking-wider pb-2 transition-all duration-300 ${
                                        statusMode === 'joining' 
                                            ? 'text-white border-b border-orange-600' 
                                            : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    CLUB JOINING
                                </button>
                            </div>

                            {statusMode === 'creation' ? (
                                <>
                                    <div className="anim-status-input group relative">
                                        <input 
                                            type={showSecret ? "text" : "password"} 
                                            placeholder="Club Secret" 
                                            className="w-full bg-transparent border-b border-white py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 tracking-widest text-white"
                                        />
                                        <button 
                                            onClick={() => setShowSecret(!showSecret)}
                                            className="absolute right-2 top-2 text-gray-500 hover:text-white transition-colors"
                                        >
                                            {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    <div className="anim-status-input pt-4">
                                        <button className="w-full py-3 bg-orange-600 border border-orange-600 rounded text-white shadow-[0_0_15px_rgba(234,88,12,0.5)] hover:shadow-[0_0_25px_rgba(234,88,12,0.8)] hover:bg-orange-500 transition-all duration-300 text-sm font-bold tracking-wide">
                                            CHECK
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="anim-status-input group">
                                        <input 
                                            type="text" 
                                            placeholder="IMS" 
                                            className="w-full bg-transparent border-b border-white py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 text-white"
                                        />
                                    </div>
                                    <div className="anim-status-input pt-4">
                                        <button className="w-full py-3 bg-orange-600 border border-orange-600 rounded text-white shadow-[0_0_15px_rgba(234,88,12,0.5)] hover:shadow-[0_0_25px_rgba(234,88,12,0.8)] hover:bg-orange-500 transition-all duration-300 text-sm font-bold tracking-wide">
                                            CHECK
                                        </button>
                                    </div>
                                </>
                            )}
                          </>
                        )}
                        
                    </div>
                </div>
              )}

            </div>

            {/* Clubs Image */}
            <div className="relative order-1 md:order-2">
              <div className="anim-image">
                <Image
                  src="/landingPage/club.png"
                  alt="Clubs illustration"
                  width={600}
                  height={1400}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              {/* Decorative orange dots */}
              <div className="anim-dot absolute top-12 left-12 w-3 h-3 bg-orange-600 rounded-full"></div>
              <div className="anim-dot absolute top-32 left-4 w-2.5 h-2.5 bg-orange-600 rounded-full"></div>
              <div className="anim-dot absolute top-24 right-12 w-3 h-3 bg-orange-600 rounded-full"></div>
              <div className="anim-dot absolute top-40 right-24 w-2 h-2 bg-orange-600 rounded-full"></div>
              <div className="anim-dot absolute bottom-32 left-32 w-2.5 h-2.5 bg-orange-600 rounded-full"></div>
              <div className="anim-dot absolute bottom-20 right-8 w-3 h-3 bg-orange-600 rounded-full"></div>
            </div>
          </div>
        </section>
      )}

      {/* Credits Overlay */}
      {showCredits && (
          <div className="fixed inset-0 z-[100] backdrop-blur-xl bg-black/90 flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-300">
              <button 
                  onClick={() => setShowCredits(false)}
                  className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
                  aria-label="Close"
              >
                  <X size={32} />
              </button>
              
              <div className="space-y-8 max-w-2xl">
                  <div className="space-y-2">
                       <p className="anim-credit-item text-gray-400 text-sm tracking-[0.2em] font-light">DESIGNED AND CREATED BY</p>
                       <h2 className="anim-credit-item text-6xl md:text-8xl font-black tracking-tighter text-white">
                           <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">CCIT</span>
                       </h2>
                  </div>

                  <div className="anim-credit-item w-16 h-1 bg-white/10 mx-auto rounded-full"></div>

                  <div className="space-y-4">
                      <p className="anim-credit-item text-gray-400 text-xs tracking-[0.2em] uppercase">Contributors</p>
                      <div className="anim-credit-item flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-xl md:text-2xl font-bold text-white">
                          <span className="hover:text-orange-500 transition-colors cursor-default">ANTRIN MAJI</span>
                          <span className="hidden md:block text-orange-600/30 text-sm">•</span>
                          <span className="hover:text-orange-500 transition-colors cursor-default">AYUSH SIDDHA</span>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  )
}

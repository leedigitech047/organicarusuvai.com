'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { getCartTotal, mergeGuestCart, detachCartUser } from '../lib/cart';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [trendingSearch, setTrendingSearch] = useState(['Honey', 'Spice', 'Turmeric', 'Tea', 'Organic']);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const [cartStats, setCartStats] = useState({ total: 0, totalMrp: 0, discount: 0, count: 0 });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Cart Burst effect
  const [cartBurst, setCartBurst] = useState(false);
  const [addedItem, setAddedItem] = useState(null);
  const prevCartCountRef = useRef(cartCount);

  useEffect(() => {
    const updateStats = () => {
      const stats = getCartTotal();
      setCartStats(stats);
      setCartCount(stats.count);
    };
    updateStats();
    window.addEventListener('cart-updated', updateStats);
    window.addEventListener('storage', updateStats);
    return () => {
      window.removeEventListener('cart-updated', updateStats);
      window.removeEventListener('storage', updateStats);
    };
  }, []);

  const [cartAction, setCartAction] = useState('added');
  const burstTimerRef = useRef(null);

  useEffect(() => {
    if (prevCartCountRef.current !== undefined && cartCount !== prevCartCountRef.current) {
        const wasAdded = cartCount > prevCartCountRef.current;
        setCartAction(wasAdded ? 'added' : 'removed');
        
        const cart = JSON.parse(localStorage.getItem('oa_cart') || '[]');
        if (cart.length > 0) {
          if (wasAdded) setAddedItem(cart[cart.length - 1]);
        }

        if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
        setCartBurst(true);
        burstTimerRef.current = setTimeout(() => setCartBurst(false), 2500);
    }
    prevCartCountRef.current = cartCount;
  }, [cartCount]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allSearchProducts, setAllSearchProducts] = useState([]);

  useEffect(() => {
     if (isSearchOpen) {
        if (allSearchProducts.length === 0) {
           supabase.from('products').select('id, name, slug, base_price, categories(name)').then(({data}) => {
              if (data) setAllSearchProducts(data);
           });
        }
        if (featuredProducts.length === 0) {
           supabase.from('products').select('id, name, slug, base_price').eq('is_featured', true).limit(4).then(({data}) => {
              if (data) setFeaturedProducts(data);
           });
        }
     }
  }, [isSearchOpen]);

  useEffect(() => {
     if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
     }
     const q = searchQuery.toLowerCase();
     const hits = allSearchProducts.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.categories?.name && p.categories.name.toLowerCase().includes(q))
     );
     setSearchResults(hits.slice(0, 5));
  }, [searchQuery, allSearchProducts]);

  useEffect(() => {
    if (isSearchOpen || isCartOpen || isSideMenuOpen) {
      document.body.style.overflow = 'hidden'; 
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isSearchOpen, isCartOpen, isSideMenuOpen]);

  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const locationRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => { setIsScrolled(window.scrollY > 20); };
    window.addEventListener('scroll', handleScroll);
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session) mergeGuestCart();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (event === 'SIGNED_IN') mergeGuestCart();
      if (event === 'SIGNED_OUT') detachCartUser();
      window.dispatchEvent(new Event('cart-updated'));
    });

    const saved = window.localStorage.getItem('oa_delivery_address');
    if (saved) {
      setDeliveryAddress(saved);
      setAddressInput(saved);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  const saveAddress = () => {
    const trimmed = addressInput.trim();
    if (trimmed) {
      setDeliveryAddress(trimmed);
      window.localStorage.setItem('oa_delivery_address', trimmed);
    }
    setIsLocationOpen(false);
  };

  const displayAddress = deliveryAddress 
    ? (deliveryAddress.length > 20 ? deliveryAddress.slice(0, 20) + '…' : deliveryAddress)
    : 'Set Location';

  const sideMenuItems = [
    { label: 'Login / Profile', icon: '👤', path: '/account' },
    { label: 'View Cart', icon: '🛍️', path: '/cart', onClick: () => setIsCartOpen(true) },
    { label: 'View Wishlist', icon: '❤️', path: '/wishlist' },
    { label: 'Coupon Codes', icon: '🎟️', path: '/coupons' },
    { label: 'View Orders', icon: '📦', path: '/account/orders' },
    { label: 'Profile Settings', icon: '⚙️', path: '/account/settings' },
    { label: 'Feedbacks', icon: '💬', path: '/feedback' },
    { label: 'Our Blog', icon: '📝', path: '/blogs' },
  ];

  if (pathname.startsWith('/secureadmin')) return null;

  return (
    <>
      <header className="relative z-50 bg-[#003322] text-white shadow-2xl overflow-hidden transition-all duration-500">
        {/* FOREST ANIMATION LAYER */}
        <div className="header-animation-bg h-full" style={{ opacity: isScrolled ? 0.4 : 1 }}>
          
          {/* REALISTIC HILLS BACKGROUND (Layered with gradients) */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none opacity-40">
            <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path fill="#082d1e" d="M0,192L60,202.7C120,213,240,235,360,218.7C480,203,600,149,720,138.7C840,128,960,160,1080,181.3C1200,203,1320,213,1380,218.7L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
              <path fill="#0d4029" d="M0,256L120,245.3C240,235,480,213,720,224C960,235,1200,277,1320,298.7L1440,320L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,120,320L0,320Z"></path>
            </svg>
          </div>

          {/* MOVING CLOUDS (New Layer) */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(4)].map((_, i) => (
              <svg key={i} className="absolute animate-cloud" style={{ 
                top: `${5 + (i * 15)}%`, 
                left: `${-20}%`,
                width: `${150 + (i * 50)}px`,
                animationDuration: `${25 + (i * 10)}s`,
                animationDelay: `${-i * 5}s`
              }} viewBox="0 0 100 60">
                <circle cx="20" cy="35" r="15" fill="white" opacity="0.1" />
                <circle cx="45" cy="35" r="20" fill="white" opacity="0.1" />
                <circle cx="70" cy="35" r="15" fill="white" opacity="0.1" />
              </svg>
            ))}
          </div>

          {/* GLIDING BIRDS (More and Bigger) */}
          <div className="absolute inset-0 pointer-events-none opacity-70">
             {[...Array(12)].map((_, i) => (
                <svg key={i} className="absolute animate-bird" style={{ 
                  top: `${5 + (i * 7)}%`, 
                  animationDuration: `${10 + (i * 1.5)}s`,
                  animationDelay: `${-i * 2.5}s`
                }} width="24" height="18"><path d="M0 9 L12 0 L24 9" fill="none" stroke="white" strokeWidth="2"/></svg>
             ))}
          </div>

          {/* MIST / FOG LAYER */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#003322] to-transparent animate-mist opacity-30 pointer-events-none blur-xl"></div>
        </div>

        {/* HEADER CONTENT (Reduced Padding) */}
        <div className="container mx-auto relative z-10 px-6 py-2 md:py-3 lg:py-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            {/* LEFT: DRAWER & LOGO/TITLE GROUP */}
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsSideMenuOpen(true)}
                className="flex items-center gap-2 group transition-transform hover:scale-105 active:scale-95"
              >
                <div className="w-10 h-10 flex flex-col justify-center items-start gap-1 bg-white/10 rounded-xl p-2.5 border border-white/20 backdrop-blur-md">
                  <span className="w-5 h-0.5 bg-white rounded-full transition-all group-hover:w-3"></span>
                  <span className="w-3 h-0.5 bg-white rounded-full transition-all group-hover:w-5"></span>
                  <span className="w-4 h-0.5 bg-white rounded-full"></span>
                </div>
              </button>

              <Link href="/" className="flex items-center gap-4 group">
                <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center p-1 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm group-hover:border-[#EAB308]/50 transition-all">
                  <img src="/logos/MainLogo.svg" alt="Organic Arusuvai Logo" className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" />
                </div>
                <div className="flex flex-col">
                  <h1 className="font-display font-black text-2xl md:text-3xl lg:text-4xl tracking-tighter leading-[0.9] uppercase text-white">
                    ORGANIC<br/><span className="text-[#EAB308]">ARUSUVAI</span>
                  </h1>
                </div>
              </Link>
            </div>

            {/* RIGHT: ACTION ICONS (Minimalist Stroke) */}
            <div className="flex items-center gap-2 md:gap-4">
              <button onClick={() => setIsSearchOpen(true)} className="group p-2">
                 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white group-hover:text-[#EAB308] transition-colors"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>

              <button onClick={() => setIsCartOpen(true)} className="group relative p-2">
                 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white group-hover:text-[#EAB308] transition-colors"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                 {cartCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-[#EAB308] text-[#003322] text-[8px] font-black rounded-full flex items-center justify-center animate-bounce">{cartCount}</span>}
              </button>

              <Link href="/account" className="w-10 h-10 md:w-12 md:h-12 rounded-2xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center transition-all hover:border-[#EAB308] group">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white group-hover:text-[#EAB308]"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                )}
              </Link>
            </div>
          </div>

          {/* SECONDARY HEADER NAV (Reduced Margin) */}
          <nav className="flex items-center justify-center gap-4 md:gap-8 border-t border-white/10 pt-3">
             {[
               { name: 'Pure Spices', path: '/category/spice' },
               { name: 'Farm Direct', path: '/category/farm-products' },
               { name: 'Cold Pressed', path: '/category/cold-pressed-oils' },
               { name: 'Our Rituals', path: '/our-story' },
             ].map(link => (
               <Link 
                 key={link.name} 
                 href={link.path}
                 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#EAB308]/70 hover:text-[#EAB308] transition-all"
               >
                 {link.name}
               </Link>
             ))}
          </nav>

          {/* DELIVERY PIN PIN LOCATION (Reduced Padding) */}
          <div className="flex justify-center -mt-1">
             <button 
               onClick={() => setIsLocationOpen(!isLocationOpen)} 
               className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
             >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span className="text-[9px] font-black uppercase tracking-tighter text-white/80 group-hover:text-[#EAB308]">Deliver: {displayAddress}</span>
             </button>
          </div>
        </div>
      </header>

      {/* SIDE DRAWER MENU (Unchanged logic, just ensure logo fits) */}
      <div className={`fixed inset-0 z-[1000] transition-opacity duration-500 ${isSideMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-[#003322]/80 backdrop-blur-md" onClick={() => setIsSideMenuOpen(false)} />
        <div className={`absolute top-0 left-0 bottom-0 w-full max-w-sm bg-white shadow-2xl transition-transform duration-500 transform ${isSideMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
          <div className="p-8 bg-[#003322] text-white flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 p-2 flex items-center justify-center">
                   <img src="/logos/MainLogo.svg" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                   <h3 className="font-display font-black text-xl italic leading-none">MY ARUSUVAI</h3>
                   <p className="text-[10px] font-black uppercase tracking-widest text-[#EAB308] mt-1">Direct from heritage</p>
                </div>
             </div>
             <button onClick={() => setIsSideMenuOpen(false)} className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-xl hover:bg-white/10 transition-colors">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-1">
             {sideMenuItems.map((item, idx) => (
                <Link 
                  key={idx}
                  href={item.path}
                  onClick={(e) => {
                    setIsSideMenuOpen(false);
                    if (item.onClick) { e.preventDefault(); item.onClick(); }
                  }}
                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all group border-b border-gray-50 last:border-0"
                >
                   <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{item.icon}</span>
                   <span className="flex-1 font-black text-xs uppercase tracking-wide text-[#003322] group-hover:text-[#EAB308]">{item.label}</span>
                   <span className="text-gray-300 group-hover:text-[#EAB308] transition-colors">→</span>
                </Link>
             ))}
          </div>

          <div className="p-8 bg-gray-50 border-t border-gray-100">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">🛡️</div>
                <p className="text-[10px] font-black uppercase text-gray-400 leading-tight">100% Organic Certified<br/>Lab Tested Heritage Products</p>
             </div>
             {user && (
                <button 
                  onClick={async () => { await supabase.auth.signOut(); setIsSideMenuOpen(false); router.refresh(); }}
                  className="w-full py-4 font-black uppercase tracking-widest border-2 border-red-500 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all text-xs"
                >Logout Session</button>
             )}
          </div>
        </div>
      </div>

      {isSearchOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 animate-fade-in">
           <div className="absolute inset-0 bg-[#003322]/90 backdrop-blur-xl" onClick={() => setIsSearchOpen(false)} />
           <div className="relative z-10 w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-scale-in">
              <div className="p-8 flex items-center gap-8 border-b border-gray-100">
                 <span className="text-3xl">🔎</span>
                 <input 
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Heritage Purity..."
                    className="flex-1 text-2xl md:text-4xl font-display font-black text-[#003322] outline-none placeholder:text-gray-200"
                 />
                 <button onClick={() => setIsSearchOpen(false)} className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">✕</button>
              </div>
              <div className="p-8 max-h-[50vh] overflow-y-auto">
                 {searchQuery.trim() ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {searchResults.map(p => (
                          <Link key={p.id} href={`/product/${p.slug}`} onClick={() => setIsSearchOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-[#EAB308]/10 border border-transparent hover:border-[#EAB308] transition-all group">
                             <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-105 transition-transform">🌿</div>
                             <div>
                                <p className="font-black text-lg text-[#003322] uppercase tracking-tight leading-tight">{p.name}</p>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#EAB308] mt-1">{p.categories?.name}</p>
                             </div>
                          </Link>
                       ))}
                    </div>
                 ) : (
                    <div className="flex flex-wrap gap-2">
                       {trendingSearch.map(tag => (
                          <button key={tag} onClick={() => setSearchQuery(tag)} className="px-6 py-3 rounded-full border border-gray-100 font-black text-[10px] uppercase text-[#003322] hover:border-[#EAB308] hover:text-[#EAB308] transition-all">{tag}</button>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Cart Sidebar */}
      <div className={`fixed inset-0 z-[1000] transition-opacity duration-500 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-[#003322]/80 backdrop-blur-md" onClick={() => setIsCartOpen(false)} />
          <div className={`absolute top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl transition-transform duration-500 transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
             <div className="p-6 bg-[#003322] text-white flex items-center justify-between">
                <h2 className="font-display font-black text-xl uppercase italic">My Harvest ({cartCount})</h2>
                <button onClick={() => setIsCartOpen(false)} className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-lg hover:bg-white/10 transition-colors">✕</button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cartCount > 0 ? (
                   (() => {
                      const items = JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('oa_cart') : '[]') || [];
                      return items.map(item => (
                        <div key={`${item.id}-${item.variantId}`} className="flex gap-4 group">
                           <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl border border-gray-100 shrink-0 overflow-hidden shadow-sm group-hover:scale-105 transition-transform font-bold">
                              {item.image?.length > 10 ? <img src={item.image} className="w-full h-full object-contain" /> : item.image || '🌿'}
                           </div>
                           <div className="flex-1 min-w-0 pt-1">
                              <h4 className="font-black text-[#003322] uppercase tracking-tight truncate text-sm">{item.name}</h4>
                              <p className="text-[9px] font-black text-gray-400 mt-1 uppercase tracking-widest">{item.variant}</p>
                              <div className="flex items-center justify-between mt-3">
                                 <p className="font-black text-lg text-[#003322]">₹{(item.price * item.qty).toFixed(0)}</p>
                                 <div className="flex items-center gap-2 bg-gray-100 px-2 py-0.5 rounded-full text-[10px] font-black">QTY: {item.qty}</div>
                              </div>
                           </div>
                        </div>
                      ));
                   })()
                ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-30 pb-20">
                      <div className="text-6xl mb-4 grayscale">🛍️</div>
                      <h3 className="font-display font-black text-xl mb-1 text-[#003322]">Cart is Empty</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest">Start your journey into purity</p>
                   </div>
                )}
             </div>
             {cartCount > 0 && (
                <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-3">
                   <div className="flex justify-between items-center px-1">
                      <span className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Basket Value</span>
                      <span className="text-2xl font-black text-[#003322]">₹{cartStats.total?.toFixed(0)}</span>
                   </div>
                   <button onClick={() => { setIsCartOpen(false); router.push(user ? '/checkout' : '/account?redirect=/checkout'); }} className="w-full py-4 bg-[#EAB308] text-[#003322] font-black uppercase tracking-widest rounded-xl shadow-glow-cta hover:scale-[1.02] transition-all text-sm">Proceed to Checkout →</button>
                </div>
             )}
          </div>
      </div>
    </>
  );
}

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';

const features = [
  { title: 'Farm Direct', desc: 'Sourced strictly from single-origin growers.', icon: '🧑‍🌾' },
  { title: 'Zero Chemicals', desc: '100% natural, heirloom quality guaranteed.', icon: '🍃' },
  { title: 'Premium Harvest', desc: 'Only the finest grades make the cut.', icon: '✨' },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const carouselMappings = [
    { slugPart: 'honey', video: '/videos/hero/honey_cursourel.mp4' },
    { slugPart: 'pepper', video: '/videos/hero/pepper_cursourel.mp4' },
    { slugPart: 'garlic', video: '/videos/hero/garlic_cursourel.mp4' },
    { slugPart: 'cardamom', video: '/videos/hero/cardamom_cursourel.mp4' },
    { slugPart: 'banana', video: '/videos/hero/banana_cursourel.mp4' },
  ];


  useEffect(() => {
    // interval removed. Transition is now driven by video playback onEnded.
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Combined query to fetch products with related categories, variants, and images in one trip
        const { data: prods, error: pError } = await supabase
          .from('products')
          .select(`
            *,
            categories (name, slug),
            product_variants (*),
            product_images (image_url)
          `)
          .order('id', { ascending: true });

        const { data: cats, error: cError } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true });

        if (cError) throw cError;
        if (pError) throw pError;

        if (cats) setCategories(cats);

        if (prods) {
          setProducts(prods.map(p => ({
            ...p,
            category: p.categories?.name,
            categorySlug: p.categories?.slug,
            variants: p.product_variants || [],
            images: p.product_images?.length > 0 
              ? p.product_images.map(img => img.image_url) 
              : ['🌿'],
          })));
        }
      } catch (err) {
        console.error('Error loading homepage data:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="bg-white min-h-screen">
      {/* Video Carousel Hero - Redesigned as a Premium Card */}
      <section className="max-w-7xl mx-auto my-8 md:my-12 px-4">
         <div className="relative h-[600px] md:h-[750px] w-full rounded-[3.5rem] overflow-hidden bg-primary-950 text-white shadow-2xl transition-all duration-700">
            {/* Carousel Logic */}
            {carouselMappings.map((slide, i) => {
               const productMatch = products.find(p => p.slug.includes(slide.slugPart));
               const isActive = i === currentSlide;
               
               return (
                 <div 
                   key={i} 
                   className={`absolute inset-0 transition-opacity duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] z-0 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}
                 >
                    {/* Background Video */}
                    {isActive && (
                      <video
                         src={slide.video}
                         autoPlay
                         muted
                         playsInline
                         onEnded={() => setCurrentSlide((prev) => (prev + 1) % 5)}
                         className="absolute inset-0 w-full h-full object-cover z-0 opacity-[0.8] mix-blend-screen scale-105"
                      />
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary-950 via-primary-950/40 to-transparent z-10" />

                    {/* Foreground Content */}
                    <div className="absolute inset-0 z-20 flex items-center p-8 md:p-16">
                       <div className="w-full flex flex-col md:flex-row items-center justify-between gap-12">
                          
                          {/* Left Content */}
                          <div className="max-w-xl text-center md:text-left">
                             <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cta-500/20 text-[10px] font-black text-cta-400 tracking-widest uppercase mb-6 animate-fade-in border border-cta-500/30">
                                <span className="w-2 h-2 rounded-full bg-cta-500 animate-pulse" />
                                Fresh Stock Spotlight
                             </div>
                             
                             <h1 className="font-display font-black text-4xl md:text-7xl tracking-tighter leading-[0.9] mb-6 drop-shadow-2xl">
                               {productMatch ? productMatch.name.split(' ')[0] : 'Purity'} <br/>
                               <span className="text-cta-400">{productMatch ? productMatch.name.split(' ').slice(1).join(' ') : 'From the Hills.'}</span>
                             </h1>
                             
                             <p className="text-base md:text-lg text-primary-100/90 font-medium mb-10 max-w-lg leading-relaxed">
                               Experience the authentic sequence of Kodaikanal. Heirloom spices and premium crops—delivered direct.
                             </p>
                             
                             <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                                <Link href={productMatch ? `/product/${productMatch.slug}` : '/category/all'} className="btn-cta w-full sm:w-auto !px-8 !py-4 !text-base shadow-glow-cta">
                                  Shop This Item →
                                </Link>
                             </div>
                          </div>

                          {/* Integrated Product Card */}
                          {productMatch && (
                             <div className="hidden lg:flex flex-col items-center animate-scale-in delay-200">
                                <div className="w-80 shrink-0 relative z-20 hover:rotate-1 transition-transform duration-500">
                                   <ProductCard product={productMatch} />
                                </div>
                             </div>
                          )}

                       </div>
                    </div>
                 </div>
               );
            })}

            {/* Carousel Navigation Layer */}
            <div className="absolute bottom-10 left-10 right-10 z-30 flex items-center justify-between">
               <div className="flex gap-2.5">
                  {carouselMappings.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`transition-all duration-500 rounded-full h-1.5 
                        ${i === currentSlide ? 'w-10 bg-cta-400 shadow-glow-cta' : 'w-3 bg-white/20 hover:bg-white/40'}`}
                    />
                  ))}
               </div>
               
               <div className="flex gap-3">
                  <button onClick={() => setCurrentSlide(p => (p - 1 + 5) % 5)} className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 transition-all">←</button>
                  <button onClick={() => setCurrentSlide(p => (p + 1) % 5)} className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 transition-all">→</button>
               </div>
            </div>
         </div>
      </section>

      {/* Categories (Apple Glass Cards) */}
      <section className="py-24 max-w-7xl mx-auto px-4 relative z-10 -mt-20">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {categories.map((cat, i) => {
             const imageName = cat.name === 'Spice' ? 'Spices' : cat.name;
             return (
               <Link 
                 key={cat.id} 
                 href={`/category/${cat.slug}`}
                 className="group relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden bg-primary-50 shadow-float hover:shadow-2xl transition-all duration-500 animate-fade-in-up"
                 style={{ animationDelay: `${i * 100}ms` }}
               >
                  <div 
                     className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110" 
                     style={{ backgroundImage: `url('/images/categories/${imageName}.png')` }} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-primary-950/40 to-transparent z-10" />
                  <div className="absolute bottom-0 left-0 p-8 z-20">
                     <h3 className="font-display font-black text-3xl text-white tracking-tight mb-2 drop-shadow-md">{cat.name}</h3>
                     <p className="text-sm font-bold text-gray-300 uppercase tracking-widest drop-shadow-md">{cat.description}</p>
                  </div>
               </Link>
             );
           })}
         </div>
      </section>

      {/* Trending Products Grid (Swiggy layout) */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
             <div>
               <h2 className="font-display font-black text-4xl md:text-5xl text-gray-900 tracking-tight mb-2">Editor's Picks</h2>
               <p className="text-gray-500 font-medium">Curated selection of our highest grade harvests.</p>
             </div>
             <Link href="/category/all" className="btn-ghost !bg-white border border-gray-200 shadow-sm">
               View All Products
             </Link>
          </div>

          {loading ? (
             <Loading />
          ) : (
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
               {products.slice(0, 8).map((product, i) => (
                 <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                    <ProductCard product={product} />
                 </div>
               ))}
             </div>
          )}
        </div>
      </section>

      {/* Visual Storytelling */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="bg-primary-950 rounded-[3rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl relative">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cta-500/20 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="lg:w-1/2 p-12 lg:p-20 flex flex-col justify-center relative z-10">
            <h2 className="font-display font-black text-4xl lg:text-5xl text-white tracking-tight leading-tight mb-6">
              The <span className="text-cta-400">Organic</span> Difference.
            </h2>
            <p className="text-primary-100/80 text-lg mb-12 font-medium leading-relaxed">
              We bypass middle-men. Our spices and crops are hand-picked from heirloom roots deep within the Western Ghats, ensuring maximum potency and zero chemicals.
            </p>
            
            <div className="space-y-8">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl shrink-0 backdrop-blur-md border border-white/5">
                    {f.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">{f.title}</h4>
                    <p className="text-primary-200/60 text-sm font-medium">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:w-1/2 bg-primary-900 relative min-h-[400px] flex items-center justify-center overflow-hidden z-10">
            <div className="absolute inset-0 bg-mesh-1 opacity-30" />
            <div className="text-[200px] drop-shadow-2xl hover:scale-110 transition-transform duration-1000 animate-wiggle">🌿</div>
          </div>
        </div>
      </section>
    </div>
  );
}

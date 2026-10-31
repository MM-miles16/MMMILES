import React from 'react';
import Link from 'next/link';
import Image from 'next/image';


export const metadata = {
  title: "Top Self Drive Cars in Chennai | Best Rated Rentals",
  description:
    "Browse the top rated self drive cars available for rent in Chennai. SUVs, sedans and hatchbacks — best reviewed by 10,000+ customers at MM Miles. Book now!",
  alternates: {
    canonical: "https://www.mmmiles.com/top-cars",
  },
  openGraph: {
    title: "Top Self Drive Cars Chennai | MM Miles",
    description:
      "Best rated self drive cars for rent in Chennai. Reviewed by 10,000+ customers. Book now!",
    url: "https://www.mmmiles.com/top-cars",
  },
};

export default function TopCarsPage() {
  return (
    <div className="min-h-screen bg-black text-white py-16 px-4 sm:px-6 lg:px-8 mt-16 font-sans">
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-4">
            India&apos;s Most Loved Rides
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Explore our curated selection of top-rated, highly demanded vehicles that guarantee comfort, style, and reliability on every journey.
          </p>
        </div>

        {/* Top Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 text-center text-sm text-gray-400">
           <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
             <div className="text-3xl mb-3">⭐</div>
             <h3 className="text-yellow-500 font-bold mb-2">Highly Rated</h3>
             <p>Consistently 5-star rated by our community of verified drivers.</p>
           </div>
           <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
             <div className="text-3xl mb-3">🛡️</div>
             <h3 className="text-yellow-500 font-bold mb-2">Fully Insured</h3>
             <p>Every trip comes with comprehensive damage coverage options.</p>
           </div>
           <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
             <div className="text-3xl mb-3">🧼</div>
             <h3 className="text-yellow-500 font-bold mb-2">Sanitized Daily</h3>
             <p>Immaculate interiors detailed before every single dispatch.</p>
           </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 md:p-12 text-center">
            
            <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20">
                <span className="text-4xl">⏱️</span>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">Live Dynamic Rankings Coming Soon</h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto leading-relaxed">
              We are currently integrating real-time booking statistics to bring you a live leaderboard of our most popular vehicles based on your city.
            </p>

            <Link 
              href="/search" 
              className="inline-block border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black font-bold text-lg px-8 py-3 rounded-full transition-all duration-300 transform hover:-translate-y-1"
            >
              Explore Available Fleet
            </Link>
        </div>

        {/* Quick CTA */}
        <div className="mt-20 border-t border-zinc-800 pt-10 flex flex-col items-center justify-center gap-4">
            <p className="text-gray-400">Need help choosing the right car?</p>
            <a href="tel:8050953607" className="text-yellow-500 font-bold text-xl hover:text-yellow-400 flex items-center gap-2">
                📞 Call our Support Team
            </a>
        </div>

      </div>
    </div>
  );
}

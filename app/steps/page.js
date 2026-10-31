import React from 'react';
import Link from 'next/link';
import Image from 'next/image';


export const metadata = {
  title: "How to Book Self Drive Car Rental in Chennai",
  description:
    "Book self drive car rental in Chennai in 5 easy steps with MM Miles. Select your car, choose dates, upload documents, pay online and get home delivery. Book in 2 minutes!",
  alternates: {
    canonical: "https://www.mmmiles.com/steps",
  },
  openGraph: {
    title: "How to Book Car Rental in Chennai | MM Miles",
    description:
      "Book self drive car rental in Chennai in 5 easy steps. Zero deposit, home delivery included.",
    url: "https://www.mmmiles.com/steps",
  },
};


export default function StepsToBook() {
  return (
    <div className="min-h-screen bg-black text-white py-16 px-4 sm:px-6 lg:px-8 mt-16 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-4">
            How to Book Your Ride
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Get behind the wheel in just a few simple steps. Our booking process is designed to be fast, secure, and hassle-free.
          </p>
        </div>

        <div className="space-y-12">
          {/* Step 1 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-10 flex flex-col md:flex-row gap-8 items-center hover:border-yellow-500/30 transition-colors">
            <div className="flex-shrink-0 w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
              <span className="text-3xl font-bold text-yellow-500">1</span>
            </div>
            <div className="flex-grow text-center md:text-left">
              <h3 className="text-2xl font-bold text-white mb-3 flex items-center justify-center md:justify-start gap-2">
                <span>🔍</span> Search & Select
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Enter your pickup location, dates, and times to browse our fleet of well-maintained cars. Filter by seating capacity, transmission, or fuel type to find the perfect match for your trip.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-10 flex flex-col md:flex-row-reverse gap-8 items-center hover:border-yellow-500/30 transition-colors">
            <div className="flex-shrink-0 w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
              <span className="text-3xl font-bold text-yellow-500">2</span>
            </div>
            <div className="flex-grow text-center md:text-right">
              <h3 className="text-2xl font-bold text-white mb-3 flex items-center justify-center md:justify-end gap-2">
                Verify Profile <span>👤</span>
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Log in and upload your Driving License and Aadhar Card. Our quick verification process ensures safety and compliance before you hit the road.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-10 flex flex-col md:flex-row gap-8 items-center hover:border-yellow-500/30 transition-colors">
            <div className="flex-shrink-0 w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
              <span className="text-3xl font-bold text-yellow-500">3</span>
            </div>
            <div className="flex-grow text-center md:text-left">
              <h3 className="text-2xl font-bold text-white mb-3 flex items-center justify-center md:justify-start gap-2">
                <span>💳</span> Review & Pay
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Review your trip details, select your preferred insurance plan, apply any promo codes, and securely complete your payment. All pricing is transparent—no hidden fees.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-10 flex flex-col md:flex-row-reverse gap-8 items-center hover:border-yellow-500/30 transition-colors">
            <div className="flex-shrink-0 w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
              <span className="text-3xl font-bold text-yellow-500">4</span>
            </div>
            <div className="flex-grow text-center md:text-right">
              <h3 className="text-2xl font-bold text-white mb-3 flex items-center justify-center md:justify-end gap-2">
                Drive Away <span>🚘</span>
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Pick up your clean, fully sanitized car from the designated location at your scheduled time. Do a quick vehicle inspection via the app, grab the keys, and enjoy your journey!
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link 
            href="/search" 
            className="inline-block bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold text-lg px-8 py-4 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transform hover:-translate-y-1 transition-all duration-200"
          >
            Start Booking Now
          </Link>
        </div>
      </div>
    </div>
  );
}

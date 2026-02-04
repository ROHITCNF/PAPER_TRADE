'use client';
import { useState, useEffect, useCallback } from 'react';
import Header from './header';
import MarketStatus from './marketStatus';
import QuickView from './quickView';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col">

            <Header />
            <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto w-full">
                <div className="bg-neutral-800/40 border border-white/5 rounded-2xl p-6 min-h-[500px] flex flex-col items-start justify-start text-neutral-600 text-xl hover:border-white/10 transition-colors">
                    {/* Left Column Content */}
                    <QuickView />
                    <MarketStatus />
                </div>
                <div className="bg-neutral-800/40 border border-white/5 rounded-2xl p-6 min-h-[500px] flex flex-col items-center justify-center text-neutral-600 text-xl hover:border-white/10 transition-colors">
                    {/* Right Column Content */}
                    <p>Order Entry & Positions</p>
                </div>
            </div>
        </div>
    )
}
'use client';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { baseUrl } from "../../utils/constant";
import { getCookie } from "../../utils/helper";

export default function HomePage() {
    const [profileData, setProfileData] = useState(null);
    const fetchProfileData = async () => {
        try {
            const response = await fetch(`${baseUrl}/profile`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": JSON.stringify({
                        web_token: getCookie("web_token"),
                        auth_code: getCookie("auth_code"),
                        access_token: getCookie("access_token"),
                    }),
                },
                credentials: "include",
            });
            const data = await response.json();
            console.log(data);
            setProfileData(data);
        } catch (error) {
            console.log(error);

        }
    }
    useEffect(() => {
        fetchProfileData();
    }, []);
    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col">
            <header className="flex justify-between items-center px-8 py-4 bg-neutral-900/70 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent tracking-tighter">
                    PaperTrade AI
                </div>
                <nav className="flex gap-8 hidden md:flex">
                    <Link href="/profile" className="text-neutral-400 hover:text-white hover:bg-white/5 px-4 py-2 rounded-lg transition-all text-sm font-medium">Profile</Link>
                    <Link href="/funds" className="text-neutral-400 hover:text-white hover:bg-white/5 px-4 py-2 rounded-lg transition-all text-sm font-medium">Funds</Link>
                    <Link href="/reports" className="text-neutral-400 hover:text-white hover:bg-white/5 px-4 py-2 rounded-lg transition-all text-sm font-medium">Reports</Link>
                    <Link href="/assistant" className="text-neutral-400 hover:text-white hover:bg-white/5 px-4 py-2 rounded-lg transition-all text-sm font-medium">Assistant</Link>
                </nav>
            </header>

            <main className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto w-full">
                <div className="bg-neutral-800/40 border border-white/5 rounded-2xl p-6 min-h-[500px] flex flex-col items-center justify-center text-neutral-600 text-xl hover:border-white/10 transition-colors">
                    {/* Left Column Content */}
                    <p>Market Data & Charts</p>
                </div>
                <div className="bg-neutral-800/40 border border-white/5 rounded-2xl p-6 min-h-[500px] flex flex-col items-center justify-center text-neutral-600 text-xl hover:border-white/10 transition-colors">
                    {/* Right Column Content */}
                    <p>Order Entry & Positions</p>
                </div>
            </main>
        </div>
    )
}
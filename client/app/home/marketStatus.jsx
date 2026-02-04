import { exchangeCode, segmentCode } from "../../utils/constant";
import { baseUrl } from "../../utils/constant";
import { useState, useEffect } from "react";
import { getCookie } from "../../utils/helper";

const MarketStatus = () => {
    const [marketStatus, setMarketStatus] = useState(null);
    const fetchMarketStatus = async () => {
        try {
            const response = await fetch(`${baseUrl}/marketData/marketStatus`, {
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
            const responseData = await response.json();
            setMarketStatus(responseData?.data?.marketStatus);
        } catch (error) {
            console.log(error);
        }
    }
    useEffect(() => {
        fetchMarketStatus();
    }, []);

    // Filter and group data
    const groupedStatus = {
        NSE: [],
        BSE: [],
        MCX: []
    };

    if (marketStatus) {
        marketStatus.forEach(item => {
            if (item.market_type === "NORMAL") {
                const exchangeName = exchangeCode[item.exchange];
                const segmentName = segmentCode[item.segment];

                if (exchangeName && groupedStatus[exchangeName]) {
                    groupedStatus[exchangeName].push({
                        ...item,
                        segmentName
                    });
                }
            }
        });
        // console.log(groupedStatus);

    }

    const StatusPill = ({ status }) => {
        const isOpen = status === "OPEN";
        const displayText = isOpen ? "OPEN" : "CLOSED";

        // Dark theme styles with glass effect and glow
        let bgClass = "bg-red-500/10 text-red-500 ring-1 ring-red-500/20 shadow-red-500/10";
        let iconColor = "text-red-500";

        if (isOpen) {
            bgClass = "bg-green-500/10 text-green-500 ring-1 ring-green-500/20 shadow-green-500/10";
            iconColor = "text-green-500";
        }
        // else if (status === "POSTCLOSE_CLOSED") {
        //     // Grey/Slate for PostClose to match mockup's grey pills
        //     bgClass = "bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20 shadow-slate-500/10";
        //     iconColor = "text-slate-400";
        // }

        const icon = isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-3.5 h-3.5 ${iconColor}`}>
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
            </svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-3.5 h-3.5 ${iconColor}`}>
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
            </svg>
        );

        return (
            <div className="items-center px-3 py-1 ">
                {icon}
            </div>
        );
    };

    return (
        <div className="w-full bg-neutral-900/50 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
            <div className="flex items-center justify-center mb-6">
                <span className="text-sm font-normal text-neutral-400 tracking-wide uppercase">Market Status</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/5">
                {/* NSE Column */}
                <div className="flex flex-col gap-8 px-6 first:pl-0">
                    <h3 className="text-xl font-semibold text-neutral-400 tracking-wide uppercase">NSE</h3>
                    <div className="flex flex-col gap-6">
                        {groupedStatus.NSE.map((item, index) => (
                            <div key={index} className="flex items-center justify-between group">
                                <span className="text-neutral-200 text-sm font-medium group-hover:text-white transition-colors duration-300">{item.segmentName}</span>
                                <StatusPill status={item.status} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* BSE Column */}
                <div className="flex flex-col gap-8 px-6">
                    <h3 className="text-xl font-semibold text-neutral-400 tracking-wide uppercase">BSE</h3>
                    <div className="flex flex-col gap-6">
                        {groupedStatus.BSE.map((item, index) => (
                            <div key={index} className="flex items-center justify-between group">
                                <span className="text-neutral-200 text-sm font-medium group-hover:text-white transition-colors duration-300">{item.segmentName}</span>
                                <StatusPill status={item.status} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* MCX Column */}
                <div className="flex flex-col gap-8 px-6 last:pr-0">
                    <h3 className="text-xl font-semibold text-neutral-400 tracking-wide uppercase">MCX</h3>
                    <div className="flex flex-col gap-6">
                        {groupedStatus.MCX.map((item, index) => (
                            <div key={index} className="flex items-center justify-between group">
                                <span className="text-neutral-200 text-sm font-medium group-hover:text-white transition-colors duration-300">{item.segmentName}</span>
                                <StatusPill status={item.status} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MarketStatus;
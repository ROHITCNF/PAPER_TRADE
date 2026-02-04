import { useEffect, useState } from "react";
import { baseUrl, quickViewPayload } from '../../utils/constant';
import { getCookie } from '../../utils/helper'

const QuickView = () => {
    const [quickViewQuotes, setQuickViewQuotes] = useState(quickViewPayload);
    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(`${baseUrl}/merketData/quotes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": JSON.stringify({
                        web_token: getCookie("web_token"),
                        auth_code: getCookie("auth_code"),
                        access_token: getCookie("access_token"),
                    }),
                },
                body: JSON.stringify(quickViewPayload),
            });
            const data = await response.json();
            if (data?.code === 200) {
                setQuickViewQuotes(data?.data?.d);
            }
            else {
                setQuickViewQuotes([]);
            }
        }
        fetchData();
    }, [])
    return (
        <div className="w-full mt-6 bg-neutral-900/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-center py-4 border-b border-white/5">
                <span className="text-sm font-normal text-neutral-400 tracking-wide uppercase">Quick View</span>
            </div>
            <div className="flex flex-col">
                {quickViewQuotes?.map((quote, index) => (
                    <div key={index} className="flex items-center justify-between px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer group">
                        <span className="text-neutral-200 text-sm font-medium group-hover:text-white transition-colors">{quote?.v?.short_name}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-neutral-200 text-sm font-medium">{quote?.v?.lp}</span>
                            <span className={`text-xs font-medium ${quote?.v?.ch > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {quote?.v?.ch} ({`${quote?.v?.chp || 0.00}%`})
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default QuickView;
import { useState, useEffect } from "react";
import { baseUrl } from "../../utils/constant";
import { getCookie, deleteAllCookie } from "../../utils/helper";
import Navbar from "./navbar";
import { tokenExpiredMessage } from "../../utils/constant";
const Header = () => {
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
            const responseData = await response.json();
            if (responseData?.error?.code === -8 && responseData?.error?.message === tokenExpiredMessage) {
                // delete all the cookie and refresh the page 
                deleteAllCookie();
                window.location.reload();
            }

            setProfileData(responseData?.data?.data);
        } catch (error) {
            console.log(error);

        }
    }
    useEffect(() => {
        fetchProfileData();
    }, []);
    return (
        <header className="flex justify-between items-center px-8 py-4 bg-neutral-900/70 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent tracking-tighter">
                PaperTrade AI
            </div>
            <Navbar profileData={profileData} />
        </header>
    )
}

export default Header
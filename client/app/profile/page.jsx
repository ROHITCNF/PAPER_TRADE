"use client";
import { useEffect } from "react";
import { baseUrl } from "../../utils/constant";
import { getCookie } from "../../utils/helper";
import { redirect } from "next/navigation";
export default function ProfilePage() {
  const verifyToken = async () => {
    const response = await fetch(`${baseUrl}/verify_token`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: JSON.stringify({
          web_token: getCookie("web_token"),
          auth_code: getCookie("auth_code"),
          access_token: getCookie("access_token"),
        }),
      },
    });
    const data = await response.json();
    if (data && data.code === 401) {
      redirect("/login");
    }
    console.log(data);
  };
  useEffect(() => {
    // verifyToken();
  }, []);

  return (
    <div>
      <h1>Profile Page</h1>
    </div>
  );
}

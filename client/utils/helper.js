// utils/cookie.js
'use client';
export const setCookie = ({
    name,
    value,
    maxAge = 86400,        // default 1 day in seconds
    path = "/",
    secure = false,
    sameSite = "Strict",
  }) => {
    document.cookie = `${name}=${value}; path=${path}; max-age=${maxAge}; ${secure ? "secure;" : ""} samesite=${sameSite}`;
    console.log("Cookie set", document.cookie);
  };
  export const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };
  
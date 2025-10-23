"use client";
import { baseUrl } from "../../utils/constant";
import { setCookie , getCookie } from "../../utils/helper";
import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
export default function LoginPage() {
 const [isAuthCodeGenerated, setIsAuthCodeGenerated] = useState("");
 const [emailId, setEmailId] = useState("");
 const [password, setPassword] = useState("");

async function handleSubmit(e) {
   e.preventDefault();
   console.log("Email ID:", emailId);
   console.log("Password:", password);
   // TODO: Call your backend to start FYERS login flow
   const response = await fetch(`${baseUrl}/generate_auth_code_url`, {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ email : emailId, password : password }),
   });
   const data = await response.json();
   if(data && data.code === 200){
    setCookie({ name: "web_token", value: data.web_token });
   }
   if(data && data.url){
       window.location.href = data.url;
   }
   console.log(data);
 };
 
 const checkAuthCode =  () => {
   const params = new URLSearchParams(window.location.search);
   if(params.get('auth_code')){
    setIsAuthCodeGenerated(params.get('auth_code'));
    setCookie({ name: "auth_code", value: params.get('auth_code') });
   }
   
 }
 const verifyToken = async () => {
   const response = await fetch(`${baseUrl}/verify_token`, {
     method: "GET",
     headers: {
       "Content-Type": "application/json",
       "Authorization":  JSON.stringify({
         web_token: getCookie("web_token"),
         auth_code: getCookie("auth_code"),
         access_token: getCookie("access_token"),
       }),
     },
   });
   const data = await response.json();
   if(data && data.code === 200){
    redirect("/profile");
   }
   console.log(data);
 };

  useEffect(() => {
  //verifyToken();
  checkAuthCode();
  }, []);

  const generateAccessToken = async () => {
   const response = await fetch(`${baseUrl}/generate_access_token`, {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ authCode: isAuthCodeGenerated }),
   });
   const data = await response.json();
   const accessToken = data.accessToken;
   console.log("Access token generated", accessToken);
   setCookie({ name: "access_token", value: accessToken });
   redirect("/home");
  }
  if(isAuthCodeGenerated){
    console.log("Auth code generated", isAuthCodeGenerated);
    return (
       <div style={styles.container}>
       <button style={styles.button} onClick={generateAccessToken}>
         Generate Access Token
       </button>
       </div>
    )
    
  }

 return (
   <div style={styles.container}>
     <h2 style={styles.title}>Login with  Credentials</h2>
     <form onSubmit={handleSubmit} style={styles.form}>
       <input
         style={styles.input}
         type="text"
         placeholder="Email Id"
         value={emailId}
         onChange={(e) => setEmailId(e.target.value)}
         required
       />

       <input
         style={styles.input}
         type="password"
         placeholder="Password"
         value={password}
         onChange={(e) => setPassword(e.target.value)}
         required
       />
       <p>Don't have an account ? <a style={{cursor: "pointer"}} href="/signup">Sign up</a></p>
       <button style={styles.button} type="submit">
         Login
       </button>
     </form>
   </div>
 );
}

const styles = {
 container: { maxWidth: "400px", margin: "80px auto", textAlign: "center" },
 title: { marginBottom: "20px" },
 form: { display: "flex", flexDirection: "column", gap: "12px" },
 input: { padding: "10px", fontSize: "16px", borderRadius: "6px", border: "1px solid #ccc" },
 button: {
   padding: "10px",
   fontSize: "16px",
   backgroundColor: "#0070f3",
   color: "white",
   border: "none",
   borderRadius: "6px",
   cursor: "pointer",
 },
};

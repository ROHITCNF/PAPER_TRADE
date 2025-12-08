"use client";

import { useState } from "react";
import { baseUrl } from "../../utils/constant";
import { redirect } from "next/navigation";
export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    appId: "",
    secretId: "",
  });

  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await res.json();
      if (data.code === 200) {
        console.log("Signup successful");
        setTimeout(() => {
          redirect("/login");
        }, 3000);
      }
      else if (data.code === 401) {
        console.log("User already exists");
        setTimeout(() => {
          redirect("/login");
        }, 3000);
      }
      else {
        console.log("Signup failed");
        setTimeout(() => {
          redirect("/signup");
        }, 3000);
      }
      console.log("Signup Response:", data);
    } catch (err) {
      console.error("Signup Error:", err);
    }
    setLoading(false);
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Create Your Account</h2>
      <form onSubmit={handleSubmit} style={styles.form}>

        <input
          style={styles.input}
          type="email"
          name="email"
          placeholder="Enter Email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          style={styles.input}
          type="password"
          name="password"
          placeholder="Enter Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <input
          style={styles.input}
          type="text"
          name="appId"
          placeholder="Enter Fyers App ID"
          value={formData.appId}
          onChange={handleChange}
          required
        />

        <input
          style={styles.input}
          type="text"
          name="secretId"
          placeholder="Enter Fyers Secret ID"
          value={formData.secretId}
          onChange={handleChange}
          required
        />
        <p>Already have an account ? <a style={{ cursor: "pointer" }} href="/login">Login</a></p>

        <button style={styles.button} disabled={loading} type="submit">
          {loading ? "Creating account..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "400px",
    margin: "80px auto",
    textAlign: "center",
  },
  title: {
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  input: {
    padding: "10px",
    fontSize: "16px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
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

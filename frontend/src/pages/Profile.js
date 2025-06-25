import React, { useEffect, useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";

function Profile() {
  const [user, setUser] = useState({});

  useEffect(() => {
    API.get("/users/me", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }).then((res) => setUser(res.data));
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px",
        fontFamily: "Segoe UI, sans-serif",
        background: "linear-gradient(135deg, #fce4ec, #e1f5fe)",
      }}
    >
      <Navbar />
      <h2 style={{ color: "#333", marginBottom: "20px" }}>👤 User Profile</h2>

      <div
        style={{
          background: "#ffffff",
          padding: "25px",
          borderRadius: "12px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          maxWidth: "500px",
        }}
      >
        <p style={{ marginBottom: "12px", fontSize: "16px" }}>
          <strong>🧑 Username:</strong> {user.username || "Loading..."}
        </p>
        <p style={{ marginBottom: "12px", fontSize: "16px" }}>
          <strong>📧 Email:</strong> {user.email || "Loading..."}
        </p>
        <p style={{ marginBottom: "12px", fontSize: "16px" }}>
          <strong>🎓 Role:</strong> {user.role || "Loading..."}
        </p>
        <p style={{ fontSize: "16px" }}>
          <strong>✅ Status:</strong>{" "}
          {user.is_approved ? (
            <span style={{ color: "green" }}>Approved</span>
          ) : (
            <span style={{ color: "red" }}>Pending Approval</span>
          )}
        </p>
      </div>
    </div>
  );
}

export default Profile;

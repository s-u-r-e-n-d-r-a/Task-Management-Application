import React, { useEffect, useState } from "react";
import API from "../api/axios";
import AdminDashboard from "./AdminDashboard";
import UserDashboard from "./UserDashboard";
import Navbar from "../components/Navbar";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("/users/me", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setUser(res.data);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!user?.is_approved) {
    return (
      <>
        <Navbar />
        <div style={{ padding: "20px", textAlign: "center", color: "#f44336" }}>
          <h2>Account Pending Approval</h2>
          <p>Your account is awaiting admin approval. Please wait.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      {user?.role === "Admin" ? <AdminDashboard /> : <UserDashboard />}
    </>
  );
}

export default Dashboard;

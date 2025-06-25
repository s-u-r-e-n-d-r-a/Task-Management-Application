import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const styles = {
    nav: {
      background: "#1e3a8a",
      color: "#fff",
      padding: "12px 24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: "2px solid #e0e7ff",
      marginBottom: "20px"
    },
    link: {
      color: "#fff",
      marginRight: "20px",
      textDecoration: "none",
      fontWeight: "500"
    },
    button: {
      background: "#ef4444",
      border: "none",
      padding: "8px 14px",
      borderRadius: "6px",
      color: "#fff",
      cursor: "pointer"
    }
  };

  return (
    <nav style={styles.nav}>
      <div>
        <Link to="/dashboard" style={styles.link}>Dashboard</Link>
        <Link to="/profile" style={styles.link}>Profile</Link>
      </div>
      <button onClick={handleLogout} style={styles.button}>Logout</button>
    </nav>
  );
}

export default Navbar;

import React from "react";
import "../App.css";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Getting the JWT token from the frontend storage and storing it in token variable.
    const token = localStorage.getItem("token");
    // If token exists, making a fetch request to the backend to signout the user.
    if (token) {
      fetch("/api/auth/signout", { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
    // Clearing the user state which will update the UI after user logs out.
    setUser(null);
    // Removing the token from the frontend local storage to prevent unauthorized access to protected routes.
    localStorage.removeItem("token");
    // Navigating the user to the Login page after Logout.
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h2 className="logo">BudgetPal</h2>
        {user && <span className="hello-item">Hello, {user.name}</span>}
      </div>
      <ul className="nav-links">
        {!user && (
          <>
            <li><Link to="/home">Home</Link></li>
            <li><Link to="/features">Features</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/signup">Signup</Link></li>
          </>
        )}

        {user && (
          <>
            {user.role === "admin" ? (
              <>
                <li><Link to="/admin/dashboard">Admin Dashboard</Link></li>
                <li><Link to="/admin/users">Manage Users</Link></li>
                <li><Link to="/admin/settings">Settings</Link></li>
              </>
            ) : (
              <>
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><Link to="/expenses">Expenses</Link></li>
                <li><Link to="/analytics">Analytics</Link></li>
                <li><Link to="/forecast">Forecast</Link></li>
                <li><Link to="/receipts">Receipts</Link></li>
                <li><Link to="/settings">Settings</Link></li>
              </>
            )}
            <li>
              <button type="button" className="logout-btn" onClick={handleLogout}>Logout</button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

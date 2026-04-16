import { useState, useEffect } from "react";

const AdminDashboard = () => {
  // We are fetching total users and active users stats from the backend.
  const [stats, setStats] = useState({ totalUsers: null, activeUsers: null });
  // We also track loading and error states to provide feedback to the admin like if the data is still being fetched or if there was an error during the fetch.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetching stats from the backend when the AdminDashboard first appears on the screen.
  useEffect(() => {
    // Getting the JWT token from the frontend local storage and storing it in a variable.
    const token = localStorage.getItem("token");
    // Sending a GET request to the backend API endpoint to fetch the stats data we also provide the JWT token to the backend for authentication.
    fetch("/api/auth/stats", { headers: { Authorization: `Bearer ${token}` } })
      // Reading the response from the backend and converting it to JSON format also we are checking if the response is successful or there was an error.
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      // If the response is not successful we throw an error with the message from the backend or a default error message. 
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || "Failed to load stats");
        // If the response is successful we update the stats state with the data we received from the backend or default to 0 if the data is missing.
        setStats({ totalUsers: data.totalUsers ?? 0, activeUsers: data.activeUsers ?? 0 });
      })
      // If an error occurs during the process we catch it and store the error message in the error state to display it to the admin.
      .catch((err) => setError(err.message))
      // Setting the Loading state to false after fetching the data to indicate that the Loading of stats is complete and we can display the data.
      .finally(() => setLoading(false));
  }, []);

  // If the data is still being loaded we display a Loading message to the admin.
  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="Total-Users-Card"><h2>Total Users</h2><p>Loading...</p></div>
        <div className="Active-Users-Card"><h2>Active Users</h2><p>Loading...</p></div>
      </div>
    );
  }

  // If there was an error during the fetch we display the error message to the admin.
  if (error) {
    return (
      <div className="admin-dashboard">
        <div style={{ gridColumn: "1 / -1" }}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div>
        <h2>Total Users</h2>
        {/*Converting the backend data to a number type and formatting it*/}
        <p>{Number(stats.totalUsers).toLocaleString()}</p>
      </div>

      <div>
        <h2>Active Users</h2>
        {/*Converting the backend data to a number type and formatting it*/}
        <p>{Number(stats.activeUsers).toLocaleString()}</p>
      </div>

      <div>
        <h2>Total Receipts Uploaded</h2>
        <p>0</p>
      </div>

      <div>
        <h2>Total Expenses Recorded</h2>
        <p>0</p>
      </div>
    </div>
  );
};

export default AdminDashboard;

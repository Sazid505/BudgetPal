import { useState, useEffect } from "react";

const Users = () => {
  // We are fetching the list of all users from the backend and storing it in the users state it starts as empty.
  const [users, setUsers] = useState([]);
  // We also track any error that might occur.
  const [error, setError] = useState("");

  // Fetching the list of users from the backend when the Users page first appears on the screen.
  useEffect(() => {
    // Getting the JWT token from the frontend local storage and storing it in a variable.
    const token = localStorage.getItem("token");
    // Sending a GET request to the backend API endpoint to fetch the list of users we also provide the JWT token to the backend for authentication.
    fetch("/api/auth/users", { headers: { Authorization: `Bearer ${token}` } })
      // Reading the response from the backend and converting it to JSON format also we are checking if the response is successful or there was an error.
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      // If the response is not successful we throw an error with the message from the backend or a default error message.
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || "Failed to load");
        // If the response is successful we update the users state with the data we received from the backend or default to an empty array if the data is missing.
        setUsers(Array.isArray(data) ? data : []);
      })
      // If an error occurs during the process we catch it and store the error message in the error state to display it to the admin.
      .catch((err) => setError(err.message));
  }, []);

  // Delete user function that deletes a user by using the user ID.
  const deleteUser = (userId) => {
    // Getting the JWT token from the frontend local storage and storing it in a variable.
    const token = localStorage.getItem("token");
    // Sending a Delete request to the backend API endpoint to delete the user with the provided user ID we also provide the JWT token to the backend for authentication.
    fetch(`/api/auth/users/${userId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
      // Reading the response from the backend and converting it to JSON format also we are checking if the response is successful or there was an error.
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      // If the response is not successful we throw an error with the message from the backend or a default error message.
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || "Failed to delete");
        // If the response is successful we update the users state by removing the deleted user from the list of users.
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      })
      // If an error occurs during the process we catch it and store the error message in the error state to display it to the admin.
      .catch((err) => setError(err.message));
  };

  // If there was an error we display the error message to the admin.
  if (error) return <div className="users-error">Error: {error}</div>;

  return (
    <div className="expense-display-card">
      <h2>All Users</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>No users found</td>
            </tr>
          ) : (
            // Displaying the list of users from users object in a table format with a delete button for each user to allow the admin to delete any user.
            users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button type="button" className="delete-btn" onClick={() => deleteUser(user.id)}>Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Users;

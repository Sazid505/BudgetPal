import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/NavBar";
import Home from "./pages/public/Home";
import Features from "./pages/public/Features";
import About from "./pages/public/About";
import Login from "./pages/public/Login";
import Signup from "./pages/public/Signup";
import Dashboard from "./pages/users/Dashboard";
import Analytics from "./pages/users/Analytics";
import Expenses from "./pages/users/Expenses";
import Receipts from "./pages/users/Receipts";
import Settings from "./pages/users/Settings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Users from "./pages/admin/Users";
import AdminSettings from "./pages/admin/AdminSettings";
import Forecast from "./pages/users/Forecast";
import "./App.css";
import { api, getToken } from "./utils/api";

/** Decode a JWT and return true if it is still valid (not expired). */
function isTokenValid(token) {
  try {
    if (!token) return false;
    const payload = JSON.parse(atob(token.split(".")[1]));
    // exp is in seconds; Date.now() is in milliseconds
    return payload.exp && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

/** Clear all auth-related keys from localStorage. */
function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function App() {
  // Restore user from localStorage — but only if the JWT token is still valid.
  // If the token has expired, clear storage and start fresh (no logged-in navbar on restart).
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem("token");
      if (!isTokenValid(token)) {
        clearSession();   // token missing or expired — treat as logged out
        return null;
      }
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  // List of expenses and income for the current user (also synced to backend)
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);

  // Persist user to localStorage whenever it changes (keeps state across page refreshes)
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  // When user logs in, load their expenses and income from the database (so it works on any browser/device)
  useEffect(() => {
    if (!user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpenses([]);
      setIncome([]);
      return;
    }
    const token = getToken();
    if (!token) {
      const savedExpenses = localStorage.getItem(`expenses_user_${user.id}`);
      const savedIncome = localStorage.getItem(`income_user_${user.id}`);
      setExpenses(savedExpenses ? JSON.parse(savedExpenses) : []);
      setIncome(savedIncome ? JSON.parse(savedIncome) : []);
      return;
    }
    // Fetch from API so data is the same on every device/browser
    Promise.all([
      api("/api/expenses").then((res) => res.json()),
      api("/api/income").then((res) => res.json())
    ])
      .then(([expensesData, incomeData]) => {
        const expenseList = Array.isArray(expensesData) ? expensesData : [];
        const incomeList = Array.isArray(incomeData) ? incomeData : [];
        setExpenses(expenseList);
        setIncome(incomeList);
      })
      .catch(() => {
        // If API fails, fall back to localStorage (e.g. offline)
        const savedExpenses = localStorage.getItem(`expenses_user_${user.id}`);
        const savedIncome = localStorage.getItem(`income_user_${user.id}`);
        setExpenses(savedExpenses ? JSON.parse(savedExpenses) : []);
        setIncome(savedIncome ? JSON.parse(savedIncome) : []);
      });
  }, [user]);

  // Save expenses to localStorage when they change
  useEffect(() => {
    if (user?.id) localStorage.setItem(`expenses_user_${user.id}`, JSON.stringify(expenses));
  }, [expenses, user]);

  // Save income to localStorage when it changes
  useEffect(() => {
    if (user?.id) localStorage.setItem(`income_user_${user.id}`, JSON.stringify(income));
  }, [income, user]);

  // Central refresh functions — keeps all pages in sync
  const refreshExpenses = () => {
    if (!getToken() || !user) return;
    api("/api/expenses").then((res) => res.json()).then((data) => {
      setExpenses(Array.isArray(data) ? data : []);
    }).catch(() => {});
  };

  const refreshIncome = () => {
    if (!getToken() || !user) return;
    api("/api/income").then((res) => res.json()).then((data) => {
      setIncome(Array.isArray(data) ? data : []);
    }).catch(() => {});
  };

  // Add a new expense: update state and sync to backend if logged in
  const addExpense = (expense) => {
    if (getToken() && user) {
      api("/api/expenses", {
        method: "POST",
        body: JSON.stringify({
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          date: expense.date
        })
      })
        .then((res) => res.json())
        .then(() => setTimeout(refreshExpenses, 300))
        .catch(() => setExpenses((prev) => [...prev, { id: Date.now(), ...expense }]));
    } else {
      setExpenses((prev) => [...prev, { id: Date.now(), ...expense }]);
    }
  };

  // Add a new income: update state and sync to backend if logged in
  const addIncome = (incomeData) => {
    if (getToken() && user) {
      api("/api/income", { method: "POST", body: JSON.stringify(incomeData) })
        .then((res) => res.json())
        .then(() => setTimeout(refreshIncome, 300))
        .catch(() => setIncome((prev) => [...prev, { id: Date.now(), ...incomeData }]));
    } else {
      setIncome((prev) => [...prev, { id: Date.now(), ...incomeData }]);
    }
  };

  // Delete expense from state and from backend if logged in
  const deleteExpense = (id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (getToken() && user) {
      api(`/api/expenses/${id}`, { method: "DELETE" })
        .then(() => setTimeout(refreshExpenses, 300))
        .catch(() => {});
    }
  };

  // Delete income from state and from backend if logged in
  const deleteIncome = (id) => {
    setIncome((prev) => prev.filter((i) => i.id !== id));
    if (getToken() && user) {
      api(`/api/income/${id}`, { method: "DELETE" })
        .then(() => setTimeout(refreshIncome, 300))
        .catch(() => {});
    }
  };

  // Update expense in state and sync to backend if logged in
  const updateExpense = (id, data) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
    if (getToken() && user) {
      api(`/api/expenses/${id}`, { method: "PUT", body: JSON.stringify(data) })
        .then(() => setTimeout(refreshExpenses, 300))
        .catch(() => {});
    }
  };

  // Update income in state and sync to backend if logged in
  const updateIncome = (id, data) => {
    setIncome((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
    if (getToken() && user) {
      api(`/api/income/${id}`, { method: "PUT", body: JSON.stringify(data) })
        .then(() => setTimeout(refreshIncome, 300))
        .catch(() => {});
    }
  };

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/features" element={<Features />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard addExpense={addExpense} addIncome={addIncome} income={income} expenses={expenses} refreshExpenses={refreshExpenses} />} />
        <Route path="/expenses" element={<Expenses expenses={expenses} income={income} deleteExpense={deleteExpense} deleteIncome={deleteIncome} updateExpense={updateExpense} updateIncome={updateIncome} />} />
        <Route path="/analytics" element={<Analytics expenses={expenses} />} />
        <Route path="/forecast" element={<Forecast />} />
        <Route path="/receipts" element={<Receipts refreshExpenses={refreshExpenses} />} />
        <Route path="/settings" element={<Settings user={user} setUser={setUser} />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/settings" element={<AdminSettings user={user} setUser={setUser} />} />
      </Routes>
    </Router>
  );
}

export default App;

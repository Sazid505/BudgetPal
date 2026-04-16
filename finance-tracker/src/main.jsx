import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Apply saved theme BEFORE React renders — prevents a dark→light flash on page load
const savedTheme = localStorage.getItem("theme") || "dark";
if (savedTheme === "light") document.body.classList.add("theme-light");

// Apply saved accessibility settings before first paint
try {
  const a11y = JSON.parse(localStorage.getItem("a11y") || "{}");
  if (a11y.fontSize === "large")       document.documentElement.style.fontSize = "19px";
  else if (a11y.fontSize === "xlarge") document.documentElement.style.fontSize = "22px";
  if (a11y.highContrast)  document.body.classList.add("a11y-contrast");
  if (a11y.reducedMotion) {
    document.body.classList.add("a11y-reduced");
    const s = document.createElement("style");
    s.id = "a11y-reduced-style";
    s.textContent = `*, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }`;
    document.head.appendChild(s);
  }
  if (a11y.focusRing) document.body.classList.add("a11y-focus");
} catch (_) {}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

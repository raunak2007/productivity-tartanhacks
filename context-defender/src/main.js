import "./style.css";
import "./ui/render.js";
import "./ui/simulation.js";
import "./logic/scheduler.js";
import "./logic/scoring.js";

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  console.log("Context Defender initialized");

  // Set up event listeners
  const ctaBtn = document.querySelector(".cta-btn");
  const navLinks = document.querySelectorAll("nav a");

  if (ctaBtn) {
    ctaBtn.addEventListener("click", () => {
      console.log("Get Started clicked");
    });
  }

  // Smooth scrolling for navigation links
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href");
      console.log("Navigating to:", targetId);
    });
  });
});

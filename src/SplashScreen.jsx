import { useState, useEffect } from "react";
import "./SplashScreen.css";

function SplashScreen({ onComplete }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const steps = [8, 18, 32, 48, 65, 80, 92, 100];
    let currentIndex = 0;

    const progressTimer = setInterval(() => {
      if (currentIndex < steps.length) {
        setProgress(steps[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(progressTimer);
      }
    }, 600);

    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 4200);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`splash-screen ${fadeOut ? "splash-fade-out" : ""}`}>
      <div className="splash-bg">
        <img src="/splash.jpg" alt="Splash" className="splash-image" />
        <div className="splash-bg-overlay" />
      </div>

      <div className="splash-center">
        <div className="splash-logo">
          <svg width="72" height="72" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="14" fill="url(#splashLogoGrad)" />
            <path d="M14 18h20M14 26h14M14 34h10" stroke="white" strokeWidth="3" strokeLinecap="round" />
            <defs>
              <linearGradient id="splashLogoGrad" x1="0" y1="0" x2="48" y2="48">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 className="splash-title">دستیار هوشمند متن</h1>
        <p className="splash-subtitle">نسخه دسکتاپ</p>

        <div className="splash-loader">
          <div className="splash-loader-bar">
            <div className="splash-loader-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="splash-loader-text">در حال آماده‌سازی...</span>
        </div>
      </div>

      <div className="splash-bottom">
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="splash-github-btn"
        >
          <svg width="18" height="18" viewBox="0 0 28 28" fill="currentColor">
            <path d="M14 3.5C9 3.5 3.5 8.5 3.5 14c0 4.5 3 8.5 7 9.5.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.2-1.5-1.2-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.6.3-1 .6-1.2-2.2-.3-4.5-1.1-4.5-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.4.1-2.9 0 0 .8-.3 2.7 1 .8-.2 1.7-.3 2.5-.3.8 0 1.7.1 2.5.3 2-.3 2.7-1 2.7-1 .5 1.5.2 2.6.1 2.9.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.5 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5 4-1 7-5 7-9.5C24.5 8.5 19 3.5 14 3.5z" />
          </svg>
          <span>Contribute on GitHub</span>
        </a>
      </div>
    </div>
  );
}

export default SplashScreen;

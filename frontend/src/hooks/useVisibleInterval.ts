import { useEffect, useRef } from "react";

/**
 * Like setInterval, but pauses while the tab is hidden (document.visibilityState === "hidden").
 * Resumes and fires immediately when the tab becomes visible again.
 */
export function useVisibleInterval(callback: () => void, delayMs: number) {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; }, [callback]);

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;

    function start() {
      if (id !== null) return;
      id = setInterval(() => savedCallback.current(), delayMs);
    }
    function stop() {
      if (id !== null) { clearInterval(id); id = null; }
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") { stop(); }
      else { savedCallback.current(); start(); }
    }

    if (document.visibilityState !== "hidden") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => { stop(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [delayMs]);
}

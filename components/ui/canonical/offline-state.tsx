"use client";

import { useEffect, useState } from "react";

export function OfflineState() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    function update() {
      setOffline(!navigator.onLine);
    }
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="border-b border-gold/30 bg-gold/10 px-4 py-2 text-center text-xs font-black uppercase tracking-wider text-gold">
      Offline mode detected. Live PROS data will refresh when the network returns.
    </div>
  );
}

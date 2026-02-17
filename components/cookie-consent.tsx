"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "fbm-cookie-consent";

export function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [accepted, setAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const v = localStorage.getItem(CONSENT_KEY);
      setAccepted(v === "1");
    } catch {
      setAccepted(null);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "1");
      setAccepted(true);
    } catch {
      setAccepted(true);
    }
  };

  if (!mounted || accepted !== false) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 p-4 shadow-lg">
      <div className="container mx-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use cookies for essential site function and analytics. By continuing you accept our use of cookies.{" "}
          <Link href="/privacy" className="underline">Privacy</Link>
        </p>
        <Button size="sm" onClick={accept}>Accept</Button>
      </div>
    </div>
  );
}

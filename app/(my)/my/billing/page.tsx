"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/nav";

export default function OwnerBillingPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stripe/create-portal-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.url) window.location.href = data.url;
        else setError(data.error || "Could not open billing portal");
      })
      .catch(() => setError("Network error"));
  }, []);

  return (
    <>
      <Nav host="my" />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">Billing</h1>
        {error ? (
          <p className="text-destructive">{error}. Sign in and ensure you have a claimed venue with billing.</p>
        ) : (
          <p className="text-muted-foreground">Redirecting to Stripe Customer Portal…</p>
        )}
      </main>
    </>
  );
}

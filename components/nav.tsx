import Link from "next/link";
import { getOwnerPortalUrl } from "@/lib/site-url";

type Host = "www" | "state" | "my";

export function Nav({ host = "www", stateCode }: { host?: Host; stateCode?: string }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center px-4">
        <Link href={host === "my" ? "/venues" : "/"} className="font-semibold mr-6">
          Find Bottomless Mimosas
        </Link>
        <nav className="flex gap-4">
          {host !== "my" && (
            <>
              <Link href="/near-me" className="text-sm text-muted-foreground hover:text-foreground">
                Near me
              </Link>
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                Cities
              </Link>
              <a href={getOwnerPortalUrl()} className="text-sm text-muted-foreground hover:text-foreground">
                Claim your spot
              </a>
              {host === "www" && (
                <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
                  Admin
                </Link>
              )}
            </>
          )}
          {host === "my" && (
            <>
              <Link href="/venues" className="text-sm text-muted-foreground hover:text-foreground">Venues</Link>
              <Link href="/billing" className="text-sm text-muted-foreground hover:text-foreground">Billing</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

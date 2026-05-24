import Link from "next/link";
import { BarChart3, Boxes, PackageCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="border-b bg-background/95">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <PackageCheck className="size-4" aria-hidden="true" />
          </span>
          <span>Allo Reservations</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <Boxes aria-hidden="true" />
              Inventory
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <BarChart3 aria-hidden="true" />
              Dashboard
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

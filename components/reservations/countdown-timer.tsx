"use client";

import * as React from "react";
import { Clock } from "lucide-react";

import { formatDuration } from "@/lib/utils";

type CountdownTimerProps = {
  expiresAt: string;
  active: boolean;
  onExpired?: () => void;
};

function secondsUntil(expiresAt: string) {
  return Math.max(
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000),
    0
  );
}

export function CountdownTimer({
  expiresAt,
  active,
  onExpired
}: CountdownTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = React.useState(() =>
    secondsUntil(expiresAt)
  );
  const expiredNotified = React.useRef(false);

  React.useEffect(() => {
    setRemainingSeconds(secondsUntil(expiresAt));

    const interval = window.setInterval(() => {
      setRemainingSeconds(secondsUntil(expiresAt));
    }, 1_000);

    return () => window.clearInterval(interval);
  }, [expiresAt]);

  React.useEffect(() => {
    if (active && remainingSeconds === 0 && !expiredNotified.current) {
      expiredNotified.current = true;
      onExpired?.();
    }
  }, [active, onExpired, remainingSeconds]);

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-4">
      <div className="flex size-10 items-center justify-center rounded-md bg-background">
        <Clock className="size-5 text-primary" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Time remaining</p>
        <p className="font-mono text-2xl font-semibold">
          {formatDuration(remainingSeconds)}
        </p>
      </div>
    </div>
  );
}

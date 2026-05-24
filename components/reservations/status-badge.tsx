import { Badge } from "@/components/ui/badge";
import type { ReservationStatus } from "@/types/api";

const variants: Record<
  ReservationStatus,
  "default" | "secondary" | "success" | "warning" | "outline"
> = {
  PENDING: "warning",
  CONFIRMED: "success",
  RELEASED: "secondary",
  EXPIRED: "outline"
};

export function StatusBadge({ status }: { status: ReservationStatus }) {
  return <Badge variant={variants[status]}>{status}</Badge>;
}

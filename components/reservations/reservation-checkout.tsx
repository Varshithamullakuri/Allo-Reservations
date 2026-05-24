"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Package, XCircle } from "lucide-react";
import { toast } from "sonner";

import { CountdownTimer } from "@/components/reservations/countdown-timer";
import { StatusBadge } from "@/components/reservations/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableRow
} from "@/components/ui/table";
import {
  useConfirmReservation,
  useReleaseReservation,
  useReservation
} from "@/hooks/use-reservations";
import { formatDateTime } from "@/lib/utils";
import { apiClient, ApiClientError } from "@/services/api-client";

export function ReservationCheckout({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const reservation = useReservation(reservationId);
  const confirmReservation = useConfirmReservation(reservationId);
  const releaseReservation = useReleaseReservation(reservationId);

  const handleExpired = useCallback(() => {
    toast.error("Reservation expired.");
    void apiClient.expireReservations().finally(() => {
      router.replace("/");
    });
  }, [router]);

  function confirm() {
    confirmReservation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Reservation confirmed.");
        router.push(`/reservations/${reservationId}/success`);
      },
      onError: (error) => {
        if (error instanceof ApiClientError) {
          toast.error(error.message);
        } else {
          toast.error("Unable to confirm reservation.");
        }
      }
    });
  }

  function release() {
    releaseReservation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Reservation released.");
        router.push("/");
      },
      onError: (error) => {
        if (error instanceof ApiClientError) {
          toast.error(error.message);
        } else {
          toast.error("Unable to release reservation.");
        }
      }
    });
  }

  if (reservation.isLoading) {
    return (
      <main className="page-shell max-w-3xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </CardHeader>
          <CardContent className="grid gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </main>
    );
  }

  if (reservation.isError || !reservation.data) {
    return (
      <main className="page-shell max-w-3xl">
        <Alert className="border-destructive/30 bg-destructive/5">
          <AlertTitle>Reservation unavailable</AlertTitle>
          <AlertDescription>
            {reservation.error instanceof Error
              ? reservation.error.message
              : "The reservation could not be loaded."}
          </AlertDescription>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/">Back to inventory</Link>
          </Button>
        </Alert>
      </main>
    );
  }

  const data = reservation.data;
  const isPending = data.status === "PENDING";
  const isExpiredByClock = new Date(data.expiresAt).getTime() <= Date.now();
  const canConfirm = isPending && !isExpiredByClock;

  return (
    <main className="page-shell max-w-3xl">
      <div className="mb-6">
        <p className="mb-2 text-sm font-medium text-primary">Checkout</p>
        <h1 className="section-heading">Reservation #{data.id}</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{data.product.name}</CardTitle>
              <CardDescription>
                {data.product.sku} from {data.warehouse.city}
              </CardDescription>
            </div>
            <StatusBadge status={data.status} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          {isPending ? (
            <CountdownTimer
              expiresAt={data.expiresAt}
              active={isPending}
              onExpired={handleExpired}
            />
          ) : null}

          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Product</TableCell>
                <TableCell>{data.product.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Warehouse</TableCell>
                <TableCell>
                  {data.warehouse.name}, {data.warehouse.city}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Quantity</TableCell>
                <TableCell>{data.quantity}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Expires</TableCell>
                <TableCell>{formatDateTime(data.expiresAt)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {!isPending ? (
            <Alert>
              <Package className="mr-2 inline size-4" aria-hidden="true" />
              <AlertTitle>Reservation is {data.status.toLowerCase()}</AlertTitle>
              <AlertDescription>
                This checkout can no longer be changed from the pending flow.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={release}
              disabled={!isPending || releaseReservation.isPending}
            >
              {releaseReservation.isPending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <XCircle aria-hidden="true" />
              )}
              Cancel
            </Button>
            <Button
              onClick={confirm}
              disabled={!canConfirm || confirmReservation.isPending}
            >
              {confirmReservation.isPending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 aria-hidden="true" />
              )}
              Confirm
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

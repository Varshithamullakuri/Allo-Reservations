"use client";

import Link from "next/link";
import { CircleCheckBig, PackageCheck } from "lucide-react";

import { StatusBadge } from "@/components/reservations/status-badge";
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
import { useReservation } from "@/hooks/use-reservations";
import { formatDateTime } from "@/lib/utils";

export function ReservationSuccess({ reservationId }: { reservationId: string }) {
  const reservation = useReservation(reservationId);

  if (reservation.isLoading) {
    return (
      <main className="page-shell max-w-3xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </main>
    );
  }

  const data = reservation.data;

  return (
    <main className="page-shell max-w-3xl">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <CircleCheckBig className="size-7" aria-hidden="true" />
          </div>
          <CardTitle>Reservation complete</CardTitle>
          <CardDescription>
            Stock has been deducted from inventory for the confirmed checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {data ? (
            <>
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <PackageCheck className="size-5 text-primary" aria-hidden="true" />
                  <div>
                    <p className="font-medium">Reservation #{data.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.product.sku}
                    </p>
                  </div>
                </div>
                <StatusBadge status={data.status} />
              </div>
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
                    <TableCell className="font-medium">Confirmed</TableCell>
                    <TableCell>{formatDateTime(data.updatedAt)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </>
          ) : null}
          <div className="flex justify-end">
            <Button asChild>
              <Link href="/">Back to inventory</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

"use client";

import { BarChart3, Boxes, Clock3, Package, RefreshCw, Warehouse } from "lucide-react";

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
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useDashboard } from "@/hooks/use-dashboard";
import { formatDateTime } from "@/lib/utils";

function StatCard({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: number;
  icon: typeof Boxes;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardLoading() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <Skeleton key={item} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

export function AdminDashboard() {
  const dashboard = useDashboard();

  return (
    <main className="page-shell">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Admin</p>
          <h1 className="section-heading">Inventory dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Live stock, active holds, and recent checkout activity.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void dashboard.refetch()}
          disabled={dashboard.isFetching}
        >
          <RefreshCw
            className={dashboard.isFetching ? "animate-spin" : undefined}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      {dashboard.isLoading ? <DashboardLoading /> : null}

      {dashboard.isError ? (
        <Alert className="border-destructive/30 bg-destructive/5">
          <AlertTitle>Dashboard unavailable</AlertTitle>
          <AlertDescription>
            {dashboard.error instanceof Error
              ? dashboard.error.message
              : "The dashboard API did not respond."}
          </AlertDescription>
        </Alert>
      ) : null}

      {dashboard.data ? (
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <StatCard
              label="Products"
              value={dashboard.data.metrics.productCount}
              icon={Package}
            />
            <StatCard
              label="Warehouses"
              value={dashboard.data.metrics.warehouseCount}
              icon={Warehouse}
            />
            <StatCard
              label="Total"
              value={dashboard.data.metrics.totalStock}
              icon={Boxes}
            />
            <StatCard
              label="Available"
              value={dashboard.data.metrics.availableStock}
              icon={BarChart3}
            />
            <StatCard
              label="Reserved"
              value={dashboard.data.metrics.reservedStock}
              icon={Clock3}
            />
            <StatCard
              label="Pending"
              value={dashboard.data.metrics.pendingReservations}
              icon={Clock3}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Inventory analytics</CardTitle>
                <CardDescription>Stock by product and warehouse</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Reserved</TableHead>
                      <TableHead>Available</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard.data.products.flatMap((product) =>
                      product.inventories.map((inventory) => (
                        <TableRow key={`${product.id}-${inventory.inventoryId}`}>
                          <TableCell>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.sku}
                            </p>
                          </TableCell>
                          <TableCell>{inventory.city}</TableCell>
                          <TableCell>{inventory.totalStock}</TableCell>
                          <TableCell>{inventory.reservedStock}</TableCell>
                          <TableCell>{inventory.availableStock}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reservation history</CardTitle>
                <CardDescription>Most recent reservations</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard.data.reservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell>#{reservation.id}</TableCell>
                        <TableCell>
                          <StatusBadge status={reservation.status} />
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{reservation.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty {reservation.quantity} in {reservation.warehouse.city}
                          </p>
                        </TableCell>
                        <TableCell>{formatDateTime(reservation.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </main>
  );
}

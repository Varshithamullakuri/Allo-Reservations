"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  PackageSearch,
  RefreshCw,
  ShoppingCart,
  Warehouse
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useProducts } from "@/hooks/use-products";
import { useCreateReservation } from "@/hooks/use-reservations";
import { ApiClientError } from "@/services/api-client";
import type {
  ProductWithInventoryDTO,
  WarehouseInventoryDTO
} from "@/types/api";

function inventoryKey(productId: string, warehouseId: string) {
  return `${productId}:${warehouseId}`;
}

function quantityValue(
  quantities: Record<string, number>,
  productId: string,
  warehouseId: string
) {
  return quantities[inventoryKey(productId, warehouseId)] ?? 1;
}

function ProductLoadingState() {
  return (
    <div className="grid gap-4">
      {[0, 1, 2].map((item) => (
        <Card key={item}>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-36 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ProductListing() {
  const router = useRouter();
  const products = useProducts();
  const createReservation = useCreateReservation();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const totals = useMemo(() => {
    const data = products.data ?? [];

    return data.reduce(
      (acc, product) => {
        for (const inventory of product.inventories) {
          acc.available += inventory.availableStock;
          acc.reserved += inventory.reservedStock;
        }

        return acc;
      },
      { available: 0, reserved: 0 }
    );
  }, [products.data]);

  function setQuantity(productId: string, warehouseId: string, value: string) {
    const next = Math.max(Number(value) || 1, 1);

    setQuantities((current) => ({
      ...current,
      [inventoryKey(productId, warehouseId)]: next
    }));
  }

  function reserve(
    product: ProductWithInventoryDTO,
    inventory: WarehouseInventoryDTO
  ) {
    const key = inventoryKey(product.id, inventory.warehouseId);
    const quantity = quantityValue(quantities, product.id, inventory.warehouseId);

    if (quantity > inventory.availableStock) {
      toast.error("Not enough available stock in this warehouse.");
      return;
    }

    setPendingKey(key);
    createReservation.mutate(
      {
        productId: product.id,
        warehouseId: inventory.warehouseId,
        quantity
      },
      {
        onSuccess: (reservation) => {
          toast.success("Stock reserved for checkout.");
          router.push(`/reservations/${reservation.id}`);
        },
        onError: (error) => {
          if (error instanceof ApiClientError && error.status === 409) {
            toast.error(error.message);
          } else {
            toast.error("Unable to create reservation.");
          }
        },
        onSettled: () => {
          setPendingKey(null);
        }
      }
    );
  }

  return (
    <main className="page-shell">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Inventory</p>
          <h1 className="section-heading">Reserve stock by warehouse</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Pending reservations hold inventory for 10 minutes and are protected
            by PostgreSQL row locks.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:min-w-80">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="mt-1 text-2xl font-semibold">{totals.available}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Reserved</p>
            <p className="mt-1 text-2xl font-semibold">{totals.reserved}</p>
          </div>
        </div>
      </div>

      {products.isLoading ? <ProductLoadingState /> : null}

      {products.isError ? (
        <Alert className="border-destructive/30 bg-destructive/5">
          <AlertTitle>Inventory unavailable</AlertTitle>
          <AlertDescription>
            {products.error instanceof Error
              ? products.error.message
              : "The inventory API did not respond."}
          </AlertDescription>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => void products.refetch()}
          >
            <RefreshCw aria-hidden="true" />
            Retry
          </Button>
        </Alert>
      ) : null}

      {products.data?.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
            <PackageSearch className="size-10 text-muted-foreground" />
            <div>
              <h2 className="font-semibold">No products found</h2>
              <p className="text-sm text-muted-foreground">
                Run the Prisma seed script to populate inventory.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-5">
        {products.data?.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{product.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {product.description}
                  </CardDescription>
                </div>
                <Badge variant="outline">{product.sku}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead className="w-28">Qty</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.inventories.map((inventory) => {
                    const key = inventoryKey(product.id, inventory.warehouseId);
                    const pending = pendingKey === key;
                    const available = inventory.availableStock;
                    const quantity = quantityValue(
                      quantities,
                      product.id,
                      inventory.warehouseId
                    );

                    return (
                      <TableRow key={inventory.inventoryId}>
                        <TableCell>
                          <div className="flex items-center gap-2 font-medium">
                            <Warehouse
                              className="size-4 text-muted-foreground"
                              aria-hidden="true"
                            />
                            <span>{inventory.city}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {inventory.warehouseName}
                          </p>
                        </TableCell>
                        <TableCell>{inventory.totalStock}</TableCell>
                        <TableCell>{inventory.reservedStock}</TableCell>
                        <TableCell>
                          <Badge variant={available > 0 ? "success" : "destructive"}>
                            {available}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            max={Math.max(available, 1)}
                            value={quantity}
                            onChange={(event) =>
                              setQuantity(
                                product.id,
                                inventory.warehouseId,
                                event.target.value
                              )
                            }
                            className="w-24"
                            disabled={available <= 0}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            disabled={
                              available <= 0 ||
                              pending ||
                              createReservation.isPending
                            }
                            onClick={() => reserve(product, inventory)}
                          >
                            {pending ? (
                              <Loader2
                                className="animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <ShoppingCart aria-hidden="true" />
                            )}
                            Reserve
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}

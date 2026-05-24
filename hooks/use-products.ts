"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/services/api-client";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: apiClient.getProducts,
    refetchInterval: 15_000
  });
}

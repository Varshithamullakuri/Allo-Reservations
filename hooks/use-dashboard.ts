"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/services/api-client";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: apiClient.getDashboard,
    refetchInterval: 15_000
  });
}

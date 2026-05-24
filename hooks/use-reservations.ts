"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/services/api-client";

export function useReservation(id: string) {
  return useQuery({
    queryKey: ["reservation", id],
    queryFn: () => apiClient.getReservation(id),
    enabled: id.length > 0,
    refetchInterval: (query) => {
      const reservation = query.state.data;

      return reservation?.status === "PENDING" ? 5_000 : false;
    }
  });
}

export function useReservations() {
  return useQuery({
    queryKey: ["reservations"],
    queryFn: apiClient.getReservations,
    refetchInterval: 15_000
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.createReservation,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["products"]
      });
      void queryClient.invalidateQueries({
        queryKey: ["dashboard"]
      });
      void queryClient.invalidateQueries({
        queryKey: ["reservations"]
      });
    }
  });
}

export function useConfirmReservation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.confirmReservation(id),
    onSuccess: (reservation) => {
      void queryClient.setQueryData(["reservation", id], reservation);
      void queryClient.invalidateQueries({
        queryKey: ["products"]
      });
      void queryClient.invalidateQueries({
        queryKey: ["dashboard"]
      });
      void queryClient.invalidateQueries({
        queryKey: ["reservations"]
      });
    }
  });
}

export function useReleaseReservation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.releaseReservation(id),
    onSuccess: (reservation) => {
      void queryClient.setQueryData(["reservation", id], reservation);
      void queryClient.invalidateQueries({
        queryKey: ["products"]
      });
      void queryClient.invalidateQueries({
        queryKey: ["dashboard"]
      });
      void queryClient.invalidateQueries({
        queryKey: ["reservations"]
      });
    }
  });
}

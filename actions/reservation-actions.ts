"use server";

import { createReservationSchema } from "@/schemas/reservation.schema";
import {
  confirmReservation,
  createReservation,
  releaseReservation
} from "@/services/reservation.service";

export async function createReservationAction(input: unknown) {
  const parsed = createReservationSchema.parse(input);
  return createReservation(parsed);
}

export async function confirmReservationAction(id: string) {
  return confirmReservation(id);
}

export async function releaseReservationAction(id: string) {
  return releaseReservation(id);
}

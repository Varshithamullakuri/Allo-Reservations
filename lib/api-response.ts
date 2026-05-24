import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AppError, isAppError } from "@/lib/errors";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(
    {
      data
    },
    init
  );
}

export function created<T>(data: T) {
  return ok(data, { status: 201 });
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: unknown
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details
      }
    },
    { status }
  );
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return apiError("VALIDATION_ERROR", "Invalid request payload", 400, {
      issues: error.issues
    });
  }

  if (isAppError(error)) {
    return apiError(
      error.code,
      error.message,
      error.statusCode,
      error.details
    );
  }

  console.error(error);
  return apiError("INTERNAL_SERVER_ERROR", "Unexpected server error", 500);
}

export function assertAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  throw error;
}

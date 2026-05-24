export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "INSUFFICIENT_STOCK"
  | "RESERVATION_EXPIRED"
  | "RESERVATION_NOT_PENDING"
  | "CONFLICT"
  | "INTERNAL_SERVER_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super("NOT_FOUND", message, 404);
  }
}

export class InsufficientStockError extends AppError {
  constructor(message = "Insufficient available stock", details?: unknown) {
    super("INSUFFICIENT_STOCK", message, 409, details);
  }
}

export class ReservationExpiredError extends AppError {
  constructor(message = "Reservation has expired") {
    super("RESERVATION_EXPIRED", message, 409);
  }
}

export class ReservationNotPendingError extends AppError {
  constructor(message = "Reservation is not pending") {
    super("RESERVATION_NOT_PENDING", message, 409);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super("CONFLICT", message, 409);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

import type {
  ApiFailure,
  ApiSuccess,
  DashboardSnapshotDTO,
  ExpiryJobResultDTO,
  ProductWithInventoryDTO,
  ReservationDTO
} from "@/types/api";

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function parseJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text) as ApiSuccess<unknown> | ApiFailure;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });
  const payload = await parseJson(response);

  if (!response.ok) {
    const failure = payload as ApiFailure | null;
    const message = failure?.error?.message ?? "Request failed";
    const code = failure?.error?.code ?? "REQUEST_FAILED";

    throw new ApiClientError(
      response.status,
      code,
      message,
      failure?.error?.details
    );
  }

  return (payload as ApiSuccess<T>).data;
}

export const apiClient = {
  getProducts() {
    return request<ProductWithInventoryDTO[]>("/api/products");
  },
  getProduct(id: string) {
    return request<ProductWithInventoryDTO>(`/api/products/${id}`);
  },
  getReservations() {
    return request<ReservationDTO[]>("/api/reservations");
  },
  getReservation(id: string) {
    return request<ReservationDTO>(`/api/reservations/${id}`);
  },
  createReservation(input: {
    productId: string;
    warehouseId: string;
    quantity: number;
  }) {
    return request<ReservationDTO>("/api/reservations", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },
  confirmReservation(id: string) {
    return request<ReservationDTO>(`/api/reservations/${id}/confirm`, {
      method: "POST"
    });
  },
  releaseReservation(id: string) {
    return request<ReservationDTO>(`/api/reservations/${id}/release`, {
      method: "POST"
    });
  },
  expireReservations() {
    return request<ExpiryJobResultDTO>("/api/jobs/expire-reservations", {
      method: "POST"
    });
  },
  getDashboard() {
    return request<DashboardSnapshotDTO>("/api/dashboard");
  }
};

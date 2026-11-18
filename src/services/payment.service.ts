import {
  CreateOrUpdatePaymentDto,
  GetPaymentsParams,
  PagedResult,
  PaymentDto,
} from "@/types/payment";
import api from "./api";

// GET /api/v1/payments
export const getPayments = async (
  params: GetPaymentsParams = {}
): Promise<PagedResult<PaymentDto>> => {
  try {
    const cleanParams: Record<string, string | number> = {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
    };

    if (params.userId !== undefined && params.userId > 0) {
      cleanParams.userId = params.userId;
    }
    if (params.studentId !== undefined && params.studentId > 0) {
      cleanParams.studentId = params.studentId;
    }
    if (params.currency) {
      cleanParams.currency = params.currency;
    }
    if (params.status) {
      cleanParams.status = params.status;
    }
    if (params.from) {
      cleanParams.from = params.from;
    }
    if (params.to) {
      cleanParams.to = params.to;
    }

    const response = await api.get("/payments", { params: cleanParams });
    const data = response.data?.data ?? response.data;

    return {
      items: Array.isArray(data?.items) ? data.items : [],
      totalCount: Number(data?.totalCount ?? 0),
      page: Number(data?.page ?? cleanParams.page),
      pageSize: Number(data?.pageSize ?? cleanParams.pageSize),
    };
  } catch (error) {
    console.error("Error al obtener los pagos:", error);
    throw error;
  }
};

// GET /api/v1/payments/{id}
export const getPaymentById = async (id: number): Promise<PaymentDto> => {
  try {
    const response = await api.get(`/payments/${id}`);
    return response.data?.data ?? response.data;
  } catch (error) {
    console.error(`Error al obtener el pago #${id}:`, error);
    throw error;
  }
};

function extractApiError(data: any, fallback: string): string {
  const errors = data?.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0];
    if (typeof first === "string") return first;
    if (first?.errorMessage) return first.errorMessage;
    if (first?.ErrorMessage) return first.ErrorMessage;
  }
  return data?.message || fallback;
}

// POST /api/v1/payments
export const createPayment = async (
  payment: CreateOrUpdatePaymentDto
): Promise<PaymentDto> => {
  try {
    const response = await api.post("/payments", { payment });
    if (response.data?.isSuccess === false) {
      throw new Error(extractApiError(response.data, "No se pudo registrar el pago."));
    }
    return response.data?.data ?? response.data;
  } catch (error: any) {
    if (error?.response?.data) {
      error.message = extractApiError(error.response.data, error.message);
    }
    console.error("Error al registrar el pago:", error);
    throw error;
  }
};

// PUT /api/v1/payments/{id}
export const updatePayment = async (
  id: number,
  payment: CreateOrUpdatePaymentDto
): Promise<PaymentDto> => {
  try {
    const response = await api.put(`/payments/${id}`, { id, payment });
    if (response.data?.isSuccess === false) {
      throw new Error(extractApiError(response.data, "No se pudo actualizar el pago."));
    }
    return response.data?.data ?? response.data;
  } catch (error: any) {
    if (error?.response?.data) {
      error.message = extractApiError(error.response.data, error.message);
    }
    console.error(`Error al actualizar el pago #${id}:`, error);
    throw error;
  }
};


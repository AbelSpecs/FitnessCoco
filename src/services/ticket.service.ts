import api from "./api";

export interface CreateTicketPayload {
  userId: number;
  bugName: string;
  description: string;
  platform: "android" | "iphone" | "web" | "todas";
  appVersion?: string;
  deviceModel?: string;
}

export interface UpdateTicketStatusPayload {
  isAddressed: boolean;
  resolutionNotes?: string | null;
}

export interface TicketDto {
  id: number;
  bugName: string;
  description: string;
  isAddressed: boolean;
  userId: number;
  reporterName?: string | null;
  platform: string;
  appVersion?: string | null;
  deviceModel?: string | null;
  createdAt: string;
  addressedAt?: string | null;
  resolutionNotes?: string | null;
}

// POST /api/v1/Tickets
export const createTicket = async (payload: CreateTicketPayload): Promise<TicketDto> => {
  try {
    const response = await api.post("/Tickets", {
      userId: payload.userId,
      bugName: payload.bugName.trim(),
      description: payload.description.trim(),
      platform: payload.platform,
      appVersion: payload.appVersion?.trim() || null,
      deviceModel: payload.deviceModel?.trim() || null,
    });

    return response.data?.data !== undefined ? response.data.data : response.data;
  } catch (error) {
    console.error("Error al enviar el ticket:", error);
    throw error;
  }
};

// GET /api/v1/Tickets/user/{userId}
export const getMyTickets = async (userId: number): Promise<TicketDto[]> => {
  try {
    const response = await api.get(`/Tickets/user/${userId}`);

    const data = response.data?.data !== undefined ? response.data.data : response.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error al obtener mis tickets:", error);
    throw error;
  }
};

// GET /api/v1/Tickets
export const getAllTickets = async (isAddressed?: boolean): Promise<TicketDto[]> => {
  try {
    const response = await api.get("/Tickets", {
      params: isAddressed !== undefined ? { isAddressed } : undefined,
    });

    const data = response.data?.data !== undefined ? response.data.data : response.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error al obtener todos los tickets:", error);
    throw error;
  }
};

// PATCH /api/v1/Tickets/{id}/status
export const updateTicketStatus = async (
  id: number,
  payload: UpdateTicketStatusPayload
): Promise<TicketDto> => {
  try {
    const response = await api.patch(`/Tickets/${id}/status`, {
      isAddressed: payload.isAddressed,
      resolutionNotes: payload.resolutionNotes?.trim() || null,
    });

    return response.data?.data !== undefined ? response.data.data : response.data;
  } catch (error) {
    console.error("Error al actualizar el estado del ticket:", error);
    throw error;
  }
};

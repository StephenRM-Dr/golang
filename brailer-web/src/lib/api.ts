const getApiBaseUrl = () => {
  // En producción (Vercel/Railway), usamos variables de entorno
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // En local, usamos la IP física para asegurar acceso desde otros equipos
  return "http://192.168.1.5:8080/api";
};

export const API_BASE_URL = getApiBaseUrl();
if (typeof window !== "undefined") {
  console.log("🚀 Brailer API configurada en:", API_BASE_URL);
}

export interface Transaction {
  id: number;
  fecha_pago: string;
  descripcion: string;
  monto: number;
  ciudad: string;
  banco_usado: string;
  referencia: string;
  imagen_path: string;
}

export interface Summary {
  total_general: number;
  total_mes: number;
  conteo: number;
}

export interface WhatsAppStatus {
  connected: boolean;
  qr: string;
}

export const apiService = {
  async getTransactions(): Promise<Transaction[]> {
    const response = await fetch(`${API_BASE_URL}/transactions`);
    if (!response.ok) throw new Error("Failed to fetch transactions");
    return response.json();
  },

  async getSummary(): Promise<Summary> {
    const response = await fetch(`${API_BASE_URL}/summary`);
    if (!response.ok) throw new Error("Failed to fetch summary");
    return response.json();
  },

  async createTransaction(data: FormData): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: "POST",
      body: data,
    });
    if (!response.ok) throw new Error("Failed to create transaction");
  },

  async updateTransaction(data: FormData): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: "PUT",
      body: data,
    });
    if (!response.ok) throw new Error("Failed to update transaction");
  },

  async sendWhatsApp(id: number, to?: string): Promise<void> {
    const url = to ? `${API_BASE_URL}/whatsapp/send?id=${id}&to=${to}` : `${API_BASE_URL}/whatsapp/send?id=${id}`;
    return fetch(url, { method: "POST" }).then(res => {
      if (!res.ok) throw new Error("WhatsApp error");
    });
  },

  async getWhatsAppStatus(): Promise<WhatsAppStatus> {
    const response = await fetch(`${API_BASE_URL}/whatsapp/status`);
    if (!response.ok) throw new Error("Failed to fetch WhatsApp status");
    return response.json();
  },

  async logoutWhatsApp(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/whatsapp/logout`, { method: "POST" });
    if (!response.ok) throw new Error("Failed to logout WhatsApp");
  },

  async deleteTransaction(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/transactions?id=${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete transaction");
  },

  getBaseUrl(): string {
    return API_BASE_URL;
  }
};

import { getAuthToken, logout } from './auth';

// Em produção (Docker), usa /api/v1 (Nginx remove /api e envia para backend:8080/v1)
// Em desenvolvimento, usa http://localhost:8080/v1 (acesso direto ao backend sem /api)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/v1';

// Helper function to add auth headers to requests
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    // Unauthorized - redirect to login
    logout();
    throw new Error('Sessão expirada. Faça login novamente.');
  }
  
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  
  // Some endpoints return 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }
  
  return response.json();
}

export async function fetchClients() {
  const response = await fetch(`${API_BASE_URL}/client`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function fetchGroupedPayments(filters: {
  clientId?: string;
  status?: string;
  month?: number;
  year?: number;
}) {
  const params = new URLSearchParams();
  if (filters.clientId && filters.clientId !== 'all') params.append('clientId', filters.clientId);
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters.month) params.append('month', filters.month.toString());
  if (filters.year) params.append('year', filters.year.toString());

  const response = await fetch(`${API_BASE_URL}/payment?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function markPaymentAsPaid(paymentId: number) {
  const response = await fetch(`${API_BASE_URL}/payment/${paymentId}/mark-as-paid`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function fetchClientById(id: number) {
  const response = await fetch(`${API_BASE_URL}/client/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function createPaymentGroup(data: {
  clientId: number;
  payerName: string;
  payerDocument: string;
  monthlyValue: number;
  totalInstallments: number;
  lateFeeRate?: number;
  monthlyInterestRate?: number;
  firstInstallmentDueDate: string; // ISO format YYYY-MM-DD
  observation?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/payment-group`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function updatePayment(id: number, data: {
  originalValue: number;
  dueDate: string; // ISO format YYYY-MM-DD
  paymentDate?: string; // ISO format YYYY-MM-DD
  observation?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/payment/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function fetchAllClients() {
  const response = await fetch(`${API_BASE_URL}/client`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function createClient(data: {
  clientName: string;
  address: string;
  phone?: string;
  document: string;
  bank?: string;
  lateFeeRate?: number;
  monthlyInterestRate?: number;
}) {
  const response = await fetch(`${API_BASE_URL}/client`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function updateClient(id: number, data: {
  clientName: string;
  address: string;
  phone?: string;
  document: string;
  bank?: string;
  lateFeeRate?: number;
  monthlyInterestRate?: number;
}) {
  const response = await fetch(`${API_BASE_URL}/client/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function deleteClient(id: number) {
  const response = await fetch(`${API_BASE_URL}/client/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

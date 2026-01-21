const API_BASE_URL = 'http://localhost:8080/v1';

export async function fetchClients() {
  const response = await fetch(`${API_BASE_URL}/client`);
  if (!response.ok) throw new Error('Failed to fetch clients');
  return response.json();
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

  const response = await fetch(`${API_BASE_URL}/payment?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch payments');
  return response.json();
}

export async function markPaymentAsPaid(paymentId: number) {
  const response = await fetch(`${API_BASE_URL}/payment/${paymentId}/mark-as-paid`, {
    method: 'PATCH',
  });
  if (!response.ok) throw new Error('Failed to mark payment as paid');
  return response.json();
}

export async function fetchClientById(id: number) {
  const response = await fetch(`${API_BASE_URL}/client/${id}`);
  if (!response.ok) throw new Error('Failed to fetch client');
  return response.json();
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create payment group');
  // Backend returns 200 OK with no content
  return;
}

export async function updatePayment(id: number, data: {
  originalValue: number;
  dueDate: string; // ISO format YYYY-MM-DD
  paymentDate?: string; // ISO format YYYY-MM-DD
  observation?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/payment/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update payment');
  return response.json();
}

export async function fetchAllClients() {
  const response = await fetch(`${API_BASE_URL}/client`);
  if (!response.ok) throw new Error('Failed to fetch clients');
  return response.json();
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create client');
  // Backend returns 201 Created with Location header
  return;
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update client');
  return response.json();
}

export async function deleteClient(id: number) {
  const response = await fetch(`${API_BASE_URL}/client/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete client');
  // Backend returns 204 No Content
  return;
}

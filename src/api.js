const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export async function fetchExpenses() {
  const response = await fetch(`${API_BASE}/expenses`);
  if (!response.ok) {
    throw new Error("Failed to fetch expenses");
  }
  return response.json();
}

export async function fetchCategories() {
  const response = await fetch(`${API_BASE}/categories`);
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  return response.json();
}

export async function createExpense(payload) {
  const response = await fetch(`${API_BASE}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const message = await response.json().catch(() => ({}));
    throw new Error(message.error || "Failed to create expense");
  }
  return response.json();
}

export async function deleteExpense(id) {
  const response = await fetch(`${API_BASE}/expenses/${id}`, {
    method: "DELETE"
  });
  if (!response.ok) {
    const message = await response.json().catch(() => ({}));
    throw new Error(message.error || "Failed to delete expense");
  }
}

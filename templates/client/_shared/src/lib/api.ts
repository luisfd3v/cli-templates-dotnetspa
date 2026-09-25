export interface Product {
  id: number;
  name: string;
  price: number;
}

/**
 * Requests go to a relative `/api` path on purpose: in development the dev
 * server proxies them to the API, and in production the API serves this app.
 */
const baseUrl = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${baseUrl}${path} failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const productsApi = {
  list: (): Promise<Product[]> => request<Product[]>('/products'),

  get: (id: number): Promise<Product> => request<Product>(`/products/${id}`),

  create: (product: Omit<Product, 'id'>): Promise<Product> =>
    request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    }),
};

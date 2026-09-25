import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { productsApi, type Product } from '@/lib/api';

function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await productsApi.list());
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amount = Number(price);
    if (!name || Number.isNaN(amount)) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const created = await productsApi.create({ name, price: amount });
      setProducts((current) => [...current, created]);
      setName('');
      setPrice('');
    } catch (cause) {
      setError(describe(cause));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="card">
        <header className="card__header">
          <h1>Products</h1>
          <button type="button" disabled={loading} onClick={load}>
            Reload
          </button>
        </header>

        {loading ? <p className="muted">Loading…</p> : null}
        {!loading && error ? <p className="error">{error}</p> : null}
        {!loading && !error && products.length === 0 ? <p className="muted">Nothing here yet.</p> : null}

        {!loading && !error && products.length > 0 ? (
          <ul className="list">
            {products.map((product) => (
              <li key={product.id}>
                <span>{product.name}</span>
                <strong>{product.price.toFixed(2)}</strong>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="card">
        <h2>Add a product</h2>
        <form className="form" onSubmit={handleSubmit}>
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>

          <label>
            Price
            <input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              type="number"
              min="0"
              step="0.01"
              required
            />
          </label>

          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Create'}
          </button>
        </form>
      </section>
    </>
  );
}

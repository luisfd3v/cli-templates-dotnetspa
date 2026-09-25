import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { productsApi, type Product } from '../../lib/api';

function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

@Component({
  selector: 'app-home',
  imports: [FormsModule],
  template: `
    <section class="card">
      <header class="card__header">
        <h1>Products</h1>
        <button type="button" [disabled]="loading()" (click)="load()">Reload</button>
      </header>

      @if (loading()) {
        <p class="muted">Loading…</p>
      } @else if (error()) {
        <p class="error">{{ error() }}</p>
      } @else if (products().length === 0) {
        <p class="muted">Nothing here yet.</p>
      } @else {
        <ul class="list">
          @for (product of products(); track product.id) {
            <li>
              <span>{{ product.name }}</span>
              <strong>{{ product.price.toFixed(2) }}</strong>
            </li>
          }
        </ul>
      }
    </section>

    <section class="card">
      <h2>Add a product</h2>
      <form class="form" (ngSubmit)="create()">
        <label>
          Name
          <input name="name" [(ngModel)]="name" required />
        </label>

        <label>
          Price
          <input name="price" type="number" min="0" step="0.01" [(ngModel)]="price" required />
        </label>

        <button type="submit" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Create' }}</button>
      </form>
    </section>
  `,
})
export class Home implements OnInit {
  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected name = '';
  protected price: number | null = null;

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.products.set(await productsApi.list());
    } catch (cause) {
      this.error.set(describe(cause));
    } finally {
      this.loading.set(false);
    }
  }

  protected async create(): Promise<void> {
    if (!this.name || this.price === null) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    try {
      const created = await productsApi.create({ name: this.name, price: this.price });
      this.products.update((current) => [...current, created]);
      this.name = '';
      this.price = null;
    } catch (cause) {
      this.error.set(describe(cause));
    } finally {
      this.saving.set(false);
    }
  }
}

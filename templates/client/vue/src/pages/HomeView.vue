<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { productsApi, type Product } from '@/lib/api';

const products = ref<Product[]>([]);
const name = ref('');
const price = ref<number | null>(null);
const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);

function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

async function load(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    products.value = await productsApi.list();
  } catch (cause) {
    error.value = describe(cause);
  } finally {
    loading.value = false;
  }
}

async function create(): Promise<void> {
  if (!name.value || price.value === null) {
    return;
  }

  saving.value = true;
  error.value = null;
  try {
    const created = await productsApi.create({ name: name.value, price: price.value });
    products.value = [...products.value, created];
    name.value = '';
    price.value = null;
  } catch (cause) {
    error.value = describe(cause);
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="card">
    <header class="card__header">
      <h1>Products</h1>
      <button type="button" :disabled="loading" @click="load">Reload</button>
    </header>

    <p v-if="loading" class="muted">Loading…</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <p v-else-if="products.length === 0" class="muted">Nothing here yet.</p>

    <ul v-else class="list">
      <li v-for="product in products" :key="product.id">
        <span>{{ product.name }}</span>
        <strong>{{ product.price.toFixed(2) }}</strong>
      </li>
    </ul>
  </section>

  <section class="card">
    <h2>Add a product</h2>
    <form class="form" @submit.prevent="create">
      <label>
        Name
        <input v-model="name" type="text" required />
      </label>

      <label>
        Price
        <input v-model.number="price" type="number" min="0" step="0.01" required />
      </label>

      <button type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Create' }}</button>
    </form>
  </section>
</template>

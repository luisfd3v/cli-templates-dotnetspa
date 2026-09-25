<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <div class="shell">
    <header class="shell__header">
      <span class="shell__brand">__PROJECT_NAME__</span>
      <nav class="shell__nav">
        <RouterLink to="/">Products</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </header>

    <main class="shell__main">
      <RouterView />
    </main>

    <footer class="shell__footer">
      API requests are proxied from <code>/api</code> to the ASP.NET Core backend.
    </footer>
  </div>
</template>

<script setup lang="ts">
import Footer from '@/components/organisms/Footer.vue'
import Header from '@/components/organisms/Header.vue'
</script>

<template>
  <Header />
  <!-- Pages teleport their breadcrumbs bar here (see BreadcrumbsBar). -->
  <div id="breadcrumbs-bar" />
  <main class="flex-grow py-12">
    <div class="container mx-auto px-4">
      <slot />
    </div>
  </main>
  <Footer />
</template>

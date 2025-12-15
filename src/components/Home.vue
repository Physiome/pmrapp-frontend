<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import ActionButton from './atoms/ActionButton.vue'
</script>

<template>
  <section class="text-center mb-16">
    <h1 class="text-5xl font-bold mb-4">
      Physiome Model Repository
    </h1>
    <p class="text-xl max-w-3xl mx-auto leading-relaxed">
      Welcome to the demo of the platform that will power the next generation of the
      Physiome Model Repository, written in Rust.
    </p>
  </section>

  <section class="max-w-4xl mb-12 mx-auto box">
    <div class="flex items-center justify-between flex-wrap gap-6 text-center md:text-left">
      <div class="flex-1 min-w-[250px]">
        <h2 class="text-2xl font-bold mb-2">
          Workspace Listing
        </h2>
        <p class="">
          Browse and explore all workspaces in the repository.
        </p>
      </div>
      <div class="w-full md:w-auto">
        <ActionButton
          variant="primary"
          size="lg"
          :to="'/workspace'"
          class="inline-block"
          contentSection="home_page"
        >
          View Workspaces
        </ActionButton>
      </div>
    </div>
  </section>

  <section class="p-8 text-center">
    <div class="flex items-start gap-4">
      <div class="flex-1">
        <p>
          The code for this project may be found on
          <a
            href="https://github.com/Physiome/pmrplatform/"
            target="_blank"
            rel="noopener noreferrer"
            class="text-link underline font-medium"
          >its project page on GitHub</a>.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
@import '@/assets/text-link.css';
@import '@/assets/box.css';
</style>

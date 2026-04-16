<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import KeywordBrowser from '@/components/molecules/KeywordBrowser.vue'
import NavigationCard from '@/components/molecules/NavigationCard.vue'
</script>

<template>
  <section class="text-center mt-8 mb-16">
    <h1 class="text-5xl font-bold mb-8">
      Physiome Model Repository
    </h1>
    <p class="text-xl max-w-3xl mx-auto leading-relaxed">
      The Physiome Model Repository serves as a public resource for storing,
      searching, and reusing CellML models and their metadata.
    </p>
  </section>

  <section class="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
    <NavigationCard
      to="/exposures"
      title="Exposures"
      description="Explore published models and simulation results for citation and public use."
    />

    <NavigationCard
      to="/workspaces"
      title="Workspaces"
      description="Access project files and Git-based version history for all models."
    />
  </section>

  <section class="max-w-5xl mx-auto mb-12">
    <KeywordBrowser :in-sidebar="false" />
  </section>
</template>

<style scoped>
@import '@/assets/box.css';
</style>

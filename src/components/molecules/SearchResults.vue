<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TermButton from '@/components/atoms/TermButton.vue'
import FileIcon from '@/components/icons/FileIcon.vue'
import ListContent from '@/components/molecules/ListContent.vue'
import ListItem from '@/components/molecules/ListItem.vue'
import { SEARCH_KIND_LABEL_MAP } from '@/constants/search'
import type { SearchResult } from '@/types/search'
import { getExposureIdFromResourcePath } from '@/utils/exposure'
import { formatDate, formatNumber } from '@/utils/format'
import { buildSearchQuery, isValidTerm } from '@/utils/search'

interface Props {
  results: SearchResult[]
  isLoading: boolean
  error: string | null
  term: string
  kind: string
}

const props = defineProps<Props>()

const router = useRouter()
const route = useRoute()

const textHighlightClass = 'text-highlight font-semibold'

const handleKeywordClick = (kind: string, keyword: string) => {
  router.push({ path: '/search', query: buildSearchQuery(kind, keyword, route.query) })
}

const handleAuthorClick = (kind: string, author: string) => {
  router.push({ path: '/search', query: buildSearchQuery(kind, author, route.query) })
}

const kindLabel = computed(() => {
  return SEARCH_KIND_LABEL_MAP[props.kind] || props.kind
})

const resultsCount = computed(() => props.results.length)

const hasResults = computed(() => resultsCount.value > 0)

const isIdActive = (ids: string[] | undefined) => {
  if (!ids || props.kind !== 'citation_id') return false
  return ids.some((id) => id.toLowerCase() === props.term.toLowerCase())
}
</script>

<template>
  <div>
    <p class="mb-4" v-if="!isLoading && !error">
      <template v-if="!hasResults && term.trim() === ''">
        Perform a search to see results.
      </template>
      <template v-else-if="!hasResults">
        No results for <strong>"{{ term }}"</strong> in <strong>{{ kindLabel }}</strong>
      </template>
      <template v-else-if="resultsCount === 1">
        <strong>1 result</strong> for <strong>"{{ term }}"</strong> in <strong>{{ kindLabel }}</strong>
      </template>
      <template v-else>
        <strong>{{ formatNumber(resultsCount) }} results</strong> for <strong>"{{ term }}"</strong> in <strong>{{ kindLabel }}</strong>
      </template>
    </p>

    <ListContent
      :items="results"
      :error="error"
      :is-loading="isLoading"
      error-title="Error loading search results"
      empty-message="No results found."
    >
      <template #item>
        <ListItem
          v-for="item in results"
          :key="item.resource_path"
          :title="item.data.description?.[0] || item.resource_path"
          :link="item.data.aliased_uri?.[0] || ''"
        >
          <div class="text-gray-600 dark:text-gray-400">
            <small class="inline-flex items-center gap-1 flex-wrap">
              <span>
                #{{ getExposureIdFromResourcePath(item.resource_path) }}
                <span v-if="item.data.created_ts?.[0]">
                  ·
                  Created on {{ formatDate(Number(item.data.created_ts[0])) }}
                </span>
              </span>
              <div
                v-if="item.data.model_author?.filter(isValidTerm).length"
                class="flex items-center gap-1"
              >
                <span>
                  by
                </span>
                <template v-for="(author, index) in item.data.model_author.filter(isValidTerm)" :key="index">
                  <button
                    class="cursor-pointer hover:text-link-hover transition-colors"
                    :class="kind === 'model_author' && term.toLowerCase() === author.toLowerCase()
                      ? textHighlightClass
                      : ''"
                    @click="handleAuthorClick('model_author', author)"
                  >
                    {{ author }}
                  </button>
                  <span v-if="index < item.data.model_author.filter(isValidTerm).length - 1">, </span>
                </template>
              </div>
            </small>
          </div>

          <div
            v-if="item.data.citation_author_family_name?.length || item.data.citation_id?.filter(isValidTerm).length"
            class="mt-1 flex items-center gap-1 text-gray-600 dark:text-gray-400"
          >
            <FileIcon class="w-3.5 h-3.5 flex-shrink-0" />
            <small>
              <template v-if="item.data.citation_author_family_name?.length">
                <template v-for="(author, index) in item.data.citation_author_family_name" :key="index">
                  <button
                    class="cursor-pointer hover:text-link-hover transition-colors"
                    :class="kind === 'citation_author_family_name' && term.toLowerCase() === author.toLowerCase()
                      ? textHighlightClass
                      : ''"
                    @click="handleAuthorClick('citation_author_family_name', author)"
                  >
                    {{ author }}
                  </button>
                  <span v-if="index < item.data.citation_author_family_name.length - 1">, </span>
                </template>
              </template>
              <span v-if="item.data.citation_author_family_name?.length && item.data.citation_id?.filter(isValidTerm).length"> · </span>
              <template v-if="item.data.citation_id?.filter(isValidTerm).length">
                <template v-for="(id, index) in item.data.citation_id.filter(isValidTerm)" :key="id">
                  <button
                    class="cursor-pointer hover:text-link-hover transition-colors"
                    :class="isIdActive([id]) ? textHighlightClass : ''"
                    @click="handleKeywordClick('citation_id', id)"
                  >
                    {{ id }}
                  </button>
                  <span v-if="index < item.data.citation_id.filter(isValidTerm).length - 1">, </span>
                </template>
              </template>
            </small>
          </div>
          <div v-if="item.data.cellml_keyword?.length" class="flex flex-wrap gap-2 mt-2">
            <TermButton
              v-for="keyword in item.data.cellml_keyword.filter(k => k.trim())"
              :key="keyword"
              :term="keyword"
              :active="kind === 'cellml_keyword' && term === keyword"
              @click="handleKeywordClick('cellml_keyword', keyword)"
            />
          </div>
        </ListItem>
      </template>
    </ListContent>
  </div>
</template>

<style scoped>
@import '@/assets/box.css';
@import '@/assets/text-highlight.css';
</style>

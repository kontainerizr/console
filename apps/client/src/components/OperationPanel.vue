<script lang="ts" setup>
import type { Project } from '@/utils/project-utils.js'

defineProps<{
  project?: Project
}>()
</script>

<template>
  <div
    v-if="project.operationsInProgress.length || project?.needReplay"
    class="fixed bottom-5 right-5 z-999 shadow-lg background-default-grey"
  >
    <DsfrAlert
      v-if="project?.needReplay"
      data-testid="needReplayAlert"
      title="Reprovisionnement nécessaire"
      type="warning"
    />
    <DsfrAlert
      v-else-if="project?.operationsInProgress.length"
      data-testid="operationInProgressAlert"
      title="Opération en cours..."
      :description="project?.operationsInProgress.length === 2 ? 'Une ou plusieurs tâches en attente' : ''"
      type="info"
    />
  </div>
</template>

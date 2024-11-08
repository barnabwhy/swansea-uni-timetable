<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router'
import ConsentPopup from './components/ConsentPopup.vue';
import { giveConsent, shouldAskUser, stayPrivate } from './analytics';
import { useMainStore } from './stores/main';

const { wasJustOpened } = useMainStore();

let showConsentPopup = ref(false);

(() => {
  // Don't show the popup on the data use page
  if (location.pathname == '/data-use')
    return;

  // Don't show if page was reloaded or user went forward/back, I dislike nagging users
  // I'd rather miss out on data than annoy people.
  let wasNavigatedTo = false;
  const entries = performance.getEntriesByType("navigation");
  entries.forEach((entry: any) => {
    if (entry.type === "navigate") {
      if (entry.name == location.href)
        wasNavigatedTo = true;
    }
  });

  showConsentPopup.value = wasJustOpened() && wasNavigatedTo && shouldAskUser();
})();

function dismissConsent() {
  showConsentPopup.value = false;
}

function respondConsent(val: boolean) {
  showConsentPopup.value = false;
  if (val) {
    giveConsent();
  } else {
    stayPrivate();
  }
}
</script>

<template>
  <RouterView />

  <ConsentPopup v-if="showConsentPopup" @dismiss="dismissConsent" @respond="respondConsent" />
</template>

<style scoped>

</style>

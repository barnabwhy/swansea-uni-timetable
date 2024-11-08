<script setup lang="ts">
const emit = defineEmits<{(e: 'dismiss'): void, (e: 'respond', val: boolean): void}>();
</script>

<template>
    <div class="consent-popup">
        <h3>Privacy notice</h3>
        <p>In order to make the site better, anonymous analytics are collected.</p>
        <p>You can find more details <a href="/data-use" target="_blank">here</a> (opens in a new tab).</p>
        <button @click="emit('respond', true)">I consent</button>
        <button @click="emit('respond', false)">Don't use my data</button>
        <button @click="emit('dismiss')">Hide for now</button>
    </div>
</template>

<style scoped>
.consent-popup {
    position: fixed;
    bottom: 0;
    left: 0;
    margin: 1rem;
    padding: 2rem;
    background-color: var(--color-background-strong);
    border: 0.125rem solid var(--color-heading);
    z-index: 10000000000;
}
.consent-popup h3 {
    color: var(--color-heading);
}
.consent-popup button {
    margin: 0.5rem 1rem 0 0;
    border-radius: 0;
    border: 0.125rem solid var(--color-heading);
    background-color: var(--color-background-strong);
    color: var(--color-heading);
    padding: 0.5rem 1rem;
    font-family: Arial, Helvetica, sans-serif;
    font-weight: bold;
    cursor: pointer;
}
.consent-popup button:hover, .consent-popup button:focus-visible {
    background-color: var(--color-heading);
    color: var(--color-background-strong);
}
.consent-popup button:active {
    background-color: var(--color-background-strong);
    color: var(--color-heading);
}
</style>
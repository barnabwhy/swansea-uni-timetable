<script setup lang="ts">
import { getTimetableTypes } from '../api';

const { small, active } = defineProps<{ small?: boolean, active?: string[] }>();

const emit = defineEmits(['select']);

let types = await getTimetableTypes();
</script>

<template>
    <div class="type-buttons">
        <button v-for="t of types" class="timetable-type-button" :class="{ small, active: active?.includes(t.CategoryTypeId) }" @click="emit('select', t.CategoryTypeId)">{{ t.Name }}</button>
    </div>
</template>

<style scoped>
.type-buttons {
    margin: 0.5rem 0;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.timetable-type-button {
    height: 128px;
    width: 256px;
    display: inline-block;
    box-sizing: border-box;
    background: var(--color-background-soft);
    padding: 8px;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    font-weight: bold;
    font-family: Arial, Helvetica, sans-serif;
    transition: border-color .2s, opacity .2s;
    border: 1px solid var(--color-border);
    color: var(--color-text);
    text-wrap: balance
}

.timetable-type-button.small {
  height: 72px;
  font-size: 0.875em;
}

.timetable-type-button:hover {
  border-color: var(--color-accent);
}
.timetable-type-button:active {
  opacity: 0.8;
}

.timetable-type-button.active {
  border-color: var(--color-accent-dark);
}
</style>
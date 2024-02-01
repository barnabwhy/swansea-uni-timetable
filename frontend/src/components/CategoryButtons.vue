<script setup lang="ts">
import { getTimetableCats, type TimetableCategory } from '../api';
import { computed, ref, type Ref } from 'vue';
import { useElementBounding } from '@vueuse/core';

const { type, active } = defineProps<{ type: string, active?: TimetableCategory[] }>();

const emit = defineEmits(['select']);

let cats: Ref<TimetableCategory[]> = ref([]);

let searchText = ref("");

let isFetching = ref(true);

async function initFetchCats() {
    let catsStream = await getTimetableCats(type);

    cats.value = catsStream.list;

    catsStream.addEventListener('update', () => {
        cats.value = [...catsStream.list];
    });
    catsStream.addEventListener('done', () => {
        cats.value = [...catsStream.list];
    });
}

const container: Ref<HTMLDivElement | null> = ref(null);

const { top } = useElementBounding(container);

const visibleCats = computed(() => {
    let offsetTop = container.value?.offsetTop ?? 0;
    let visibleHeight = Math.max(0, window.innerHeight - offsetTop - top.value);

    let horizontal = Math.floor((container.value?.offsetWidth ?? window.innerWidth) / (256 + 8));
    let vertical = Math.ceil(visibleHeight / (128 + 8));
    return horizontal * (vertical + 16);
});

initFetchCats()
</script>

<template>
    <input type="text" placeholder="Search" v-model="searchText">
    <div class="category-buttons" ref="container">
        <button v-for="c of cats.filter(c => c.Name.toLowerCase().includes(searchText.toLowerCase())).slice(0, visibleCats)" :key="c.Identity"
            class="timetable-category-button" :class="{ active: active?.includes(c) }" @click="emit('select', c)">{{ c.Name
            }}</button>

        <button v-if="cats.filter(c => c.Name.toLowerCase().includes(searchText.toLowerCase())).length == 0" disabled
            class="timetable-category-button">
            {{ isFetching ? 'Loading...' : 'No results' }}
        </button>
    </div>
</template>

<style scoped>
input {
    outline: none;
    border: none;
    font-size: 12px;
    background: var(--color-background-soft);
    padding: 8px 12px;
    border-radius: 4px;
    margin: 8px 0;
    width: 256px;
    box-sizing: border-box;
    display: inline-block;
    color: var(--color-heading);
    font-size: 0.75em;
}

.category-buttons {
    margin: 0.5rem 0;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.timetable-category-button {
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
    text-wrap: balance;
    content-visibility: auto;
}

.timetable-category-button:hover {
    border-color: aquamarine;
}

.timetable-category-button:active {
    opacity: 0.8;
}

.timetable-category-button:disabled {
    border-color: var(--color-border);
    cursor: default;
    opacity: 0.75;
}

.timetable-category-button.active {
    border-color: mediumaquamarine;
}
</style>
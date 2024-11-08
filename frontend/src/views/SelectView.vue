<script setup lang="ts">
import { getTimetableTypes, type TimetableCategory, type TimetableType } from '@/api';
import CategoryButtons from '@/components/CategoryButtons.vue';
import TypeButtons from '@/components/TypeButtons.vue';
import router from '@/router';
import { ref, type Ref } from 'vue';

let type: Ref<string | null> = ref(null);

let types: Ref<TimetableType[]> = ref([]);
(async () => {
    types.value = await getTimetableTypes();
})();

function selectType(id: string) {
    type.value = id;
}

let selected: Ref<{ [type: string]: Set<TimetableCategory> }> = ref({});
function selectCat(c: TimetableCategory) {
    if (!selected.value[c.CategoryTypeIdentity])
        selected.value[c.CategoryTypeIdentity] = new Set();

    if (selected.value[c.CategoryTypeIdentity].has(c))
        selected.value[c.CategoryTypeIdentity].delete(c);
    else
        selected.value[c.CategoryTypeIdentity].add(c);
}

function getAllSelected() {
    let allSelected = [];
    for (const type of types.value) {
        if (selected.value[type.CategoryTypeId])
            allSelected.push(...selected.value[type.CategoryTypeId]);
    }
    return allSelected;
}

function goToTimetable() {
    let selectedIds = getAllSelected().map(c => c.Identity);
    let selectedTypes = Object.keys(selected.value).filter(t => selected.value[t].size > 0);

    router.push(`/table/${selectedTypes[0]}/${selectedIds.join(',')}`)
}
</script>

<template>
    <div class="container">
        <main>
            <h1>The alternative timetable for Swansea University</h1>

            <!-- <button class="help-button" aria-label="Help"></button> -->

            <br>
            <h2>Select your timetable</h2>

            <Suspense>
                <TypeButtons small @select="selectType" :active="type ? [type] : []" />

                <template #fallback>
                    <span class="type-button-fallback">Loading...</span>
                </template>
            </Suspense>

            <template v-if="type">
                <Suspense>
                    <CategoryButtons :type="type" :active="selected[type] ? [...selected[type]] : []" :key="type" @select="selectCat" />

                    <template #fallback>
                        <span class="cat-button-fallback">Loading...</span>
                    </template>
                </Suspense>
            </template>
        </main>
        <details class="sidebar-toggle">
            <summary></summary>
        </details>
        <aside class="sidebar">
            <h1>Selected</h1>

            <template v-for="t in types">
                <details open>
                    <summary>{{ t.Name }}</summary>

                    <span v-if="!selected[t.CategoryTypeId] || selected[t.CategoryTypeId].size == 0">Nothing selected</span>
                    <button v-else v-for="c in selected[t.CategoryTypeId]" class="selected-category" @click="selectCat(c)">
                        {{ c.Name }}
                    </button>
                </details>
            </template>
        </aside>
        <button class="done-button" :disabled="getAllSelected().length == 0" @click="goToTimetable">Done</button>
    </div>
</template>

<style scoped>
h1 {
    display: inline-block;
    max-width: calc(100% - 10rem);
}

.container {
    display: grid;
    grid-template-columns: 1fr auto;
    height: 100%;
    overflow: hidden;
}

main {
    overflow-y: auto;
    padding: 2rem;
}

.sidebar-toggle {
    position: fixed;
    top: 2rem;
    right: 2rem;
    display: none;
    visibility: hidden;
    z-index: 10;
    rotate: 90deg;
    border: 1px solid var(--color-border);
    height: 2rem;
    width: 2rem;
    display: grid;
    align-items: center;
    border-radius: 50%;
    background-color: var(--color-background);
    cursor: pointer;
}
.sidebar-toggle summary {
    display: grid;
    padding: 0;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
}
.sidebar-toggle summary::before {
    margin: 0;
}

.sidebar-toggle:hover {
    border-color: var(--color-accent);
}

.sidebar-toggle:active {
    opacity: 0.8;
}

.sidebar {
    width: 24rem;
    padding: 2rem;
    border-left: 1px solid var(--color-border);
    height: 100%;
    overflow-y: auto;
}

.help-button {
    border-radius: 50%;
    width: 1.5rem;
    height: 1.5rem;
    background: url(/img/help-dark.svg) center / cover no-repeat;
    padding: 0;
    border: 0;
    float: right;
    vertical-align: middle;
    margin: 0.375rem 1.375rem 0.375rem 0.375rem;
}

.done-button {
    border-radius: 4px;
    vertical-align: middle;
    padding: 0.5rem 1rem;
    border: 0;
    float: right;
    background: var(--color-background-soft);
    cursor: pointer;
    font-weight: bold;
    font-family: Arial, Helvetica, sans-serif;
    transition: border-color .2s, opacity .2s;
    border: 1px solid var(--color-border);
    color: var(--color-text);
    font-size: 1.25rem;

    box-shadow: 0px 1px 4px rgba(0,0,0,0.5);
    position: fixed;
    bottom: 2rem;
    right: 26rem;
    z-index: 3;
}

.done-button:hover {
    border-color: var(--color-accent);
}

.done-button:active {
    opacity: 0.8;
}

.done-button:disabled {
    border-color: var(--color-border);
    cursor: default;
    opacity: 0.5;
}

@media (prefers-color-scheme: light) {
    .help-button {
        background: url(/img/help-light.svg) center / cover no-repeat;
    }
}

.type-button-fallback, .cat-button-fallback {
    margin: 0.5rem 0;
    height: 128px;
    line-height: 128px;
    width: 256px;
    text-align: center;
    display: block;
    box-sizing: border-box;
    background: var(--color-background-soft);
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

summary {
    padding: 0.5rem 0;
    user-select: none;
    font-weight: bold;
    font-size: 1.25rem;
    list-style: none;
}

summary::before {
    content: '';
    display: inline-block;
    width: 1em;
    height: 1em;
    vertical-align: text-bottom;
    margin-right: 0.5rem;
    background: url(/img/expand-dark.svg) center / cover no-repeat;
}

details[open] summary::before {
    vertical-align: text-top;
    background: url(/img/collapse-dark.svg) center / cover no-repeat;
}


@media (prefers-color-scheme: light) {
    summary::before {
        background: url(/img/expand-light.svg) center / cover no-repeat;
    }
    details[open] summary::before {
        background: url(/img/collapse-light.svg) center / cover no-repeat;
    }
}

summary::marker {
  display: none;
}

.selected-category {
    width: 100%;
    text-align: left;
    box-sizing: border-box;
    background: var(--color-background-soft);
    border-radius: 4px;
    padding: 0.5rem;
    margin: 0 0 0.5rem 0;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    font-family: Arial, Helvetica, sans-serif;
    transition: border-color .2s, opacity .2s;
    border: 1px solid var(--color-accent-dark);
    color: var(--color-text);
    font-weight: bold;
}

@media screen and (max-width: 64rem) {
    .container {
        grid-template-columns: 1fr;
    }

    .done-button {
        right: 2rem;
    }
    .sidebar-toggle {
        display: block;
        visibility: visible;
    }
    .sidebar {
        position: fixed;
        top: 0;
        right: -24rem;
        background-color: var(--color-background);
        transition: right 0.1s;
        padding-bottom: 5.25rem;
    }
    .sidebar-toggle[open] ~ .sidebar {
        right: 0;
    }
}

@media screen and (max-width: 36rem) {
    .sidebar {
        width: 100%;
        border: none;
        right: -100%;
    }
}
</style>
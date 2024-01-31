<script setup lang="ts">
import CategoryButtons from '@/components/CategoryButtons.vue';
import router from '@/router';

let type = router.currentRoute.value.params.type;
</script>

<template>
    <main>
        <h1>The alternative timetable for Swansea University</h1>

        <br>
        <h2>Select your timetable</h2>

        <Suspense>
            <CategoryButtons :type="type.toString()" @select="(catType, catId) => router.push(`/table/${catType}/${catId}`)" />

            <template #fallback>
                <span class="cat-button-fallback">Loading...</span>
            </template>
        </Suspense>
    </main>
</template>

<style scoped>
main {
    padding: 2rem;
}

.cat-button-fallback {
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
</style>
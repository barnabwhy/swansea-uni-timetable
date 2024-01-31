<script setup lang="ts">
import TypeButtons from '@/components/TypeButtons.vue';
import router from '@/router';
</script>

<template>
    <main>
        <h1>The alternative timetable for Swansea University</h1>

        <br>
        <h2>Select your timetable type</h2>

        <Suspense>
            <TypeButtons @select="id => router.push(`/type/${id}`)" />

            <template #fallback>
                <span class="type-button-fallback">Loading...</span>
            </template>
        </Suspense>

        <br><br>
        <h2>Multi-select (BETA)</h2>
        <button class="select-timetable-button" @click="router.push('/select')">Select your timetable more intuitively</button>
    </main>
</template>

<style scoped>
main {
    padding: 2rem;
}

.type-button-fallback {
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

.select-timetable-button {
    margin: 0.5rem 0;
    height: 96px;
    width: 256px;
    text-align: center;
    display: inline-block;
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

.select-timetable-button:hover {
  border-color: aquamarine;
}
.select-timetable-button:active {
  opacity: 0.8;
}
</style>
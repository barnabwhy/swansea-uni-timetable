<script setup lang="ts">
import router from '@/router';
import { ref } from 'vue';
import { getStartOfWeek, formatTime } from '@/util';
import type { TimetableEvent, EventsList } from '@/api';
import { API_BASE, API_V2 } from '@/api';

const DAY_STRINGS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const AUTO_RELOAD_TIME = 15 * 60 * 1000; // 15 minutes

let type = router.currentRoute.value.params.type;
let cat = router.currentRoute.value.params.cat.toString().replace(/,/g, '_');

let events = ref(null);

let weekOffset = ref(0);
let weekOffsetChangedAt = ref(Date.now());
let lastFetch = ref(0);

let fetching = ref(false);
let failed = ref(false);

async function fetchWeekEvents() {
    if (!type || !cat)
        return;

    if (weekOffsetChangedAt.value < getStartOfWeek().getTime()) {
        weekOffset.value -= 1;
        weekOffsetChangedAt.value = Date.now();
    }

    let usedWeekOffset = weekOffset.value;
    failed.value = false;
    fetching.value = true;

    try {
        let res = await fetch(API_BASE + API_V2 + `${type}/${cat}/start/${getStartOfWeek(weekOffset.value).getTime()}`);

        if (res && res.ok) {
            let data = await res.json();

            if (weekOffset.value == usedWeekOffset) {
                events.value = data;
                lastFetch.value = Date.now();
            }
        } else {
            failed.value = true;
        }
    } catch(e) {
        failed.value = true;
    }

    fetching.value = false;
}

fetchWeekEvents();

setInterval(() => {
    if (lastFetch.value < Date.now() - AUTO_RELOAD_TIME)
        fetchWeekEvents();
}, 30 * 1000); // check every 30 seconds

function prevWeek() {
    weekOffset.value--;
    weekOffsetChangedAt.value = Date.now();
    fetchWeekEvents();
}

function nextWeek() {
    weekOffset.value++;
    weekOffsetChangedAt.value = Date.now();
    fetchWeekEvents();
}

function eventsArray(events: EventsList): TimetableEvent[] {
    let eventArr = [];
    if (events.CategoryEvents) {
        for (const cat of events.CategoryEvents) {
            eventArr.push(...cat.Results);
        }
    }
    return eventArr;
}

function uniqueEvents(events: TimetableEvent[]): TimetableEvent[] {
    return [
        ...new Map(
            events.map(x => [x.Identity, x])
        ).values()
    ]
}

function filterToDay(events: TimetableEvent[], day: number): TimetableEvent[] {
    return uniqueEvents(events).filter(e => (new Date(e.StartDateTime).getDay() - 1 % 7) == day)
        .sort((a, b) => new Date(a.StartDateTime).getTime() - new Date(b.StartDateTime).getTime());
}
</script>

<template>
    <main>
        <h1>Week of {{ getStartOfWeek(weekOffset).toLocaleDateString() }}</h1>
        <!-- <span class="material-icons settings" @click="showSettings = true">settings</span> -->
        <span class="material-icons prevWeek" @click="prevWeek()">chevron_left</span>
        <span class="material-icons nextWeek" @click="nextWeek()">chevron_right</span>
        <div class="timetable" v-if="!fetching && events != null && !failed">
            <template v-for="(_, day) in 7">
                <div class="day" v-if="filterToDay(eventsArray(events), day).length > 0 || day < 5">
                    <b>{{ DAY_STRINGS[day] }}</b>
                    <template v-for="ev in filterToDay(eventsArray(events), day)">
                        <div class="event">
                            <p class="name">{{ ev.Name }}</p>
                            <p class="evType"><span class="material-icons">event</span>{{ ev.EventType }}</p>
                            <p class="time"><span class="material-icons">schedule</span>{{ formatTime(ev.StartDateTime)
                            }}-{{
    formatTime(ev.EndDateTime) }}</p>
                            <p class="location"><span class="material-icons">location_on</span>{{ ev.Location }}</p>
                        </div>
                    </template>
                    <template v-if="filterToDay(eventsArray(events), day).length == 0">
                        <div class="event">
                            <p class="bigText">Nothing on today</p>
                        </div>
                    </template>
                </div>
            </template>
        </div>
        <span class="loader" :class="{ visible: fetching }"></span>
        <span class="failure" v-if="!fetching && failed"><b>Failed to load timetable data.</b><br>Are you offline?</span>

        <!-- <div class="details" :class="{ show: showDetails || showSettings }">
            <span class="material-icons close" @click="showDetails = false; showSettings = false">close</span>
            <template v-if="detailsEvent != '' && !showSettings && detailsEv">
                <p class="name">{{ detailsEv.Name }}</p>
                <p class="evType item"><span class="material-icons">event</span>{{ detailsEv.EventType }}</p>
                <p class="time item"><span class="material-icons">schedule</span>{{ dayString(new
                    Date(detailsEv.StartDateTime).getDay()) }} {{ formatTime(detailsEv.StartDateTime) }}-{{
        formatTime(detailsEv.EndDateTime) }}</p>
                <p class="location item"><span class="material-icons">location_on</span><span
                        v-for="loc of detailsEv.Location.split(/(?<=,)/g)">{{ loc }}</span></p>
            </template>
            <template v-if="showSettings">
                <p class="name">Settings</p>
                <p class="item">Excluded terms:
                    <input ref="excludeInput" @keydown.enter="addExclude()" placeholder="Enter a term...">
                    <br>
                    <span class="excluded" v-for="ex of exclude" @click="removeExclude(ex)">{{ ex }} <span
                            class="material-icons">close</span></span>
                </p>
            </template>
        </div> -->
    </main>
</template>

<style scoped>
main {
    height: 100%;
    overflow-y: auto;
    user-select: none;
    display: grid;
    grid-template-rows: auto 1fr;
}

.loader {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: opacity 0.2s 0.05s;
    opacity: 0;
    pointer-events: none;
    background: rgba(0, 0, 0, 0.25);
}

.loader:after {
    content: '';
    position: fixed;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    width: 24px;
    height: 24px;
    border: 2px solid var(--color-heading);
    border-bottom-color: transparent;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
}

.loader.visible {
    /* visibility: visible; */
    opacity: 1;
}

.failure {
    margin: 0 2rem;
}

@keyframes rotation {
    0% {
        rotate: 0deg;
    }

    100% {
        rotate: 360deg;
    }
}

h1 {
    margin: 2rem 8rem 1rem 2rem;
    line-height: 1.25;
}

.event .material-icons, .details .material-icons {
  font-size: inherit;
  margin: 0px 4px 0px 0px;
  vertical-align: text-top;
  user-select: none;
}

.timetable {
    display: flex;
    align-items: left;
    gap: 0.5rem;
    width: 100%;
    overflow: auto;
    padding: 0 2rem 2rem 2rem;
}

.day {
    max-height: 100%;
    flex: 1;
}

.event {
    height: 128px;
    box-sizing: border-box;
    margin: 0.5rem 0px;
    background: var(--color-background-soft);
    padding: 8px;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
    /* cursor: pointer; */
    transition: box-shadow 0.2s, border-color 0.2s;
    border: 1px solid #3e3e3e;
    min-width: 256px;
}

.event p {
    margin: 0;
}

.event .bigText {
    display: block;
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    font-weight: bold;
    width: 240px;
    text-align: center;
    user-select: none;
}

.event.active {
    border-color: aquamarine;
}

.event .name {
    margin-bottom: 2px;
    margin-right: 80px;
}

.event .time {
    font-size: 11px;
    color: var(--color-text);
    position: absolute;
    right: 8px;
    top: 8px;
    line-height: 1;
}

.event .evType {
    font-size: 12px;
    color: var(--color-text);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.event .evType,
.event .location {
    font-size: 12px;
    color: var(--color-text);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.prevWeek,
.nextWeek {
    position: absolute;
    top: 2rem;
    right: 2rem;
    margin: 0;
    padding: 8px;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 32px;
    font-size: 24px;
    user-select: none;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
}

.prevWeek {
    right: 5rem;
}

.prevWeek:hover,
.nextWeek:hover {
    background-color: rgba(0, 0, 0, 0.2);
    color: var(--color-heading);
}

.prevWeek:active,
.nextWeek:active {
    background-color: rgba(0, 0, 0, 0.15);
    color: var(--color-heading);
}
</style>
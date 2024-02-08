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
let hasData = ref(false);
let failed = ref(false);

let cache: Cache;

async function fetchWeekEvents() {
    if (!type || !cat)
        return;

    if (weekOffsetChangedAt.value < getStartOfWeek().getTime()) {
        weekOffset.value -= 1;
        weekOffsetChangedAt.value = Date.now();
    }

    let usedWeekOffset = weekOffset.value;
    failed.value = false;
    hasData.value = false;
    fetching.value = true;

    try {
        const url = API_BASE + API_V2 + `${type}/${cat}/start/${getStartOfWeek(weekOffset.value).getTime()}`;
        let cached = await cache.match(url);
        if (cached) {
            let data = await cached.json();
            events.value = data;
            hasData.value = true;

            let date = cached.headers.get('date');
            let dateStr = date ? new Date(date).toLocaleString() : '<unknown date>';

            warningContent.value = `Failed fetching events for timetable.<br>Using cached data from <b>${dateStr}</b>`;
        }

        let res = await fetch(url);

        if (res && res.ok) {
            cache.put(url, res.clone());
            
            let data = await res.json();

            if (weekOffset.value == usedWeekOffset) {
                events.value = data;
                lastFetch.value = Date.now();
                hasData.value = true;
            }
        } else {
            failed.value = true;
        }
    } catch (e: any) {
        console.log(e);
        warningContent.value = `Failed fetching events for timetable.<br><br><b>Error encountered:</b><pre><code>${escape(e.toString())}</code></pre>`;

        failed.value = true;
    }

    fetching.value = false;
}

function escape(htmlStr: string): string {
   return htmlStr.replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#39;");        

}

(async () => {
    cache = await caches.open("timetable");
    fetchWeekEvents();
})();

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

let showWarningDetails = ref(false);
let warningContent = ref("Something went wrong... No details are available");
</script>

<template>
    <main>
        <h1>Week of {{ getStartOfWeek(weekOffset).toLocaleDateString() }}</h1>
        <!-- <span class="material-symbols-outlined settings" @click="showSettings = true">settings</span> -->
        <span class="material-symbols-outlined prevWeek" @click="prevWeek()">chevron_left</span>
        <span class="material-symbols-outlined nextWeek" @click="nextWeek()">chevron_right</span>
        <div class="timetable" v-if="events != null && (!fetching && !failed || hasData)">
            <template v-for="(_, day) in 7">
                <div class="day" v-if="filterToDay(eventsArray(events), day).length > 0 || day < 5">
                    <b>{{ DAY_STRINGS[day] }}</b>
                    <template v-for="ev in filterToDay(eventsArray(events), day)">
                        <div class="event">
                            <div class="topRow">
                                <p class="time">
                                    <span class="material-symbols-outlined">schedule</span>
                                    {{ formatTime(ev.StartDateTime) }}-{{ formatTime(ev.EndDateTime) }}
                                </p>
                                <p class="evType">{{ ev.EventType }}</p>
                            </div>
                            <p class="name">{{ ev.Name }}</p>
                            <p class="location detail"><span class="material-symbols-outlined">location_on</span>{{
                                ev.Location }}</p>
                            <p class="teachingWeeks detail"
                                v-if="ev.ExtraProperties.find(p => p.Name == 'Activity.TeachingWeekPattern_PatternAsArray')">
                                <span class="material-symbols-outlined">event</span>
                                Weeks {{ ev.ExtraProperties.find(p => p.Name ==
                                    'Activity.TeachingWeekPattern_PatternAsArray')?.Value }}
                            </p>
                            <p class="module detail" v-if="ev.ExtraProperties.find(p => p.Name == 'Module Description')">
                                <span class="material-symbols-outlined">school</span>
                                {{ ev.ExtraProperties.find(p => p.Name == 'Module Description')?.Value }}
                            </p>
                        </div>
                    </template>
                    <template v-if="filterToDay(eventsArray(events), day).length == 0">
                        <div class="event empty">
                            <p class="bigText">Nothing on today</p>
                        </div>
                    </template>
                </div>
            </template>
        </div>
        <span class="loader" :class="{ visible: fetching, small: hasData }"></span>
        <span class="failure" v-if="!fetching && failed && !hasData"><b>Failed to load timetable data.</b><br>Are you offline?</span>
        <span class="warning material-symbols-outlined" :class="{ visible: !fetching && failed && hasData }" @click="if (failed) { showWarningDetails = true };">warning</span>

        <div class="warning-details-overlay" v-if="showWarningDetails" @click="showWarningDetails = false"></div>
        <div class="warning-details" v-if="showWarningDetails">
            <span class="close material-symbols-outlined" @click="showWarningDetails = false">close</span>
            <h3>Warning</h3>
            <span v-html="warningContent"></span>
        </div>

        <!-- <div class="details" :class="{ show: showDetails || showSettings }">
            <span class="material-symbols-outlined close" @click="showDetails = false; showSettings = false">close</span>
            <template v-if="detailsEvent != '' && !showSettings && detailsEv">
                <p class="name">{{ detailsEv.Name }}</p>
                <p class="evType item"><span class="material-symbols-outlined">event</span>{{ detailsEv.EventType }}</p>
                <p class="time item"><span class="material-symbols-outlined">schedule</span>{{ dayString(new
                    Date(detailsEv.StartDateTime).getDay()) }} {{ formatTime(detailsEv.StartDateTime) }}-{{
        formatTime(detailsEv.EndDateTime) }}</p>
                <p class="location item"><span class="material-symbols-outlined">location_on</span><span
                        v-for="loc of detailsEv.Location.split(/(?<=,)/g)">{{ loc }}</span></p>
            </template>
            <template v-if="showSettings">
                <p class="name">Settings</p>
                <p class="item">Excluded terms:
                    <input ref="excludeInput" @keydown.enter="addExclude()" placeholder="Enter a term...">
                    <br>
                    <span class="excluded" v-for="ex of exclude" @click="removeExclude(ex)">{{ ex }} <span
                            class="material-symbols-outlined">close</span></span>
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

.loader.small {
    top: 2rem;
    left: unset;
    right: 8rem;
    width: 40px;
    height: 40px;
    background: none;
}

.loader:after {
    content: '';
    position: absolute;
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

.warning {
    box-sizing: content-box;
    position: absolute;
    top: 2rem;
    right: 8rem;
    margin: 0;
    padding: 8px;
    border-radius: 32px;
    font-size: 24px;
    user-select: none;
    cursor: pointer;
    transition: opacity 0.2s 0.05s;
    opacity: 0;
    color: rgb(255, 199, 87);
}

.warning.visible {
    /* visibility: visible; */
    opacity: 1;
}

.warning-details {
    position: fixed;
    top: 50%;
    left: calc(50% - 16rem);
    translate: 0 -50%;
    width: 32rem;
    background-color: var(--color-background);
    border: 1px solid var(--color-border);
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0px 1px 8px rgba(0,0,0,0.25);
}

@media screen and (max-width: 36rem) {
    .warning-details {
        left: 2rem;
        right: 2rem;
        width: unset;
    }
}

.warning-details-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
}

.warning-details > .close {
    position: absolute;
    top: 2rem;
    right: 2rem;
    cursor: pointer;
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
    margin: 2rem 11rem 1rem 2rem;
    line-height: 1.25;
}

.event .material-symbols-outlined,
.details .material-symbols-outlined {
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
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 0;
    min-width: 256px;
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
    margin: 0;
    font-weight: bold;
    color: var(--color-heading);
}

.event .topRow {
    font-size: 12px;
    color: var(--color-text);
    line-height: 1;
    margin-bottom: 2px;
    display: grid;
    grid-template-columns: 1fr auto;
    text-overflow: ellipsis;
    overflow: hidden;
}

.event .time {
    font-weight: bold;
}

.event .detail {
    font-size: 12px;
    color: var(--color-text);
    line-height: 1.5;
    display: box;
    display: -moz-box;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    text-overflow: ellipsis;
    overflow: hidden;
}

.empty {
    background: none;
    border-color: var(--color-background-soft);
}

.prevWeek,
.nextWeek {
    box-sizing: content-box;
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

@media screen and (max-width: 480px) {
    .event, .day {
        min-width: unset;
        width: calc(100vw - 4rem);
    }
}
</style>
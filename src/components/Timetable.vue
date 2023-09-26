<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      apiPath: "https://timetable.swansea.cymru/%t/%c/%w",
      res: [] as any[],
      days: {} as { [key: number]: any },
      exclude: [] as string[],
      loaded: false,
      loading: true,

      showDetails: false,
      detailsEvent: '',
      showSettings: false,
      
      typesPath: "https://timetable.swansea.cymru/types",
      types: [] as any[],
      selectedType: '',

      typesExPath: "https://timetable.swansea.cymru/typesEx",
      typesEx: [] as any[],

      depSearch: '',
      depsPath: "https://timetable.swansea.cymru/cats/%t/%n",
      deps: [] as any[],
      selectedDep: '',

      catSearch: '',
      catsPath: "https://timetable.swansea.cymru/cats/%t/%n",
      cats: [] as any[],
      catsFetchStartTime: 0,
      selectedCat: '',
      
      page: 'types',

      weekOffset: 0,
    } as { [key: string]: any}
  },
  computed: {
    detailsEv() {
      return this.res.CategoryEvents[0].Results.find((ev: any) => ev.EventIdentity == this.detailsEvent)
    }
  },
  methods: {
    getTime(dStr: string) {
      let d = new Date(dStr);

      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    },
    dayString(idx: number) {
      return ["Sunday", "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][idx] || idx;
    },
    startOfWeek(offset: number = 0) {
      let d = new Date(Date.now() + 24 * 3600 * 1000 * 7 * offset);
      var day = d.getDay(),
          diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
      d.setHours(0,0,0,0);
      return new Date(d.setDate(diff));
    },
    selectType(id: string) {
      this.selectedType = id;

      // this.loadDeps();
      this.loadCats();
    },
    // async loadDeps() {
    //   this.deps = [];
    //   let res = (await (await fetch(this.depsPath.replace('%t', this.typesEx.find(t => t.Identity == this.selectedType).ParentCategoryTypeIdentities[0].Identity).replace('%n', "1"))).json());
    //   this.deps.push(...res.Results);
    //   while(res.CurrentPage < res.TotalPages) {
    //     res = (await (await fetch(this.depsPath.replace('%t', this.typesEx.find(t => t.Identity == this.selectedType).ParentCategoryTypeIdentities[0].Identity).replace('%n', res.CurrentPage+1))).json());
    //     this.deps.push(...res.Results);
    //   }
    // },
    // selectDep(id: string) {
    //   this.selectedDep = id;

    //   this.loadCats();
    // },
    async loadCats() {
      let startTime = Date.now();
      this.catsFetchStartTime = startTime;
      this.cats = [];
      let res = (await (await fetch(this.catsPath.replace('%t', this.selectedType).replace('%n', "1"))).json());
      if(this.catsFetchStartTime != startTime)
        return;
      this.cats.push(...res.Results);
      while(res.CurrentPage < res.TotalPages) {
        res = (await (await fetch(this.catsPath.replace('%t', this.selectedType).replace('%n', res.CurrentPage+1))).json());
        if(this.catsFetchStartTime != startTime)
          return;
        this.cats.push(...res.Results);
      }
    },
    selectCat(id: string) {
      this.selectedCat = id;
      location.search = `?t=${this.selectedType}&c=${this.selectedCat}`
    },
    addExclude() {
      let val = (this.$refs['excludeInput'] as HTMLInputElement).value;
      (this.$refs['excludeInput'] as HTMLInputElement).value = "";
      if(val.length == 0 || this.exclude.find((ex: string) => ex.toLowerCase() == val.toLowerCase()))
        return
      this.exclude.push(val);
      
      const params = new URLSearchParams(location.search);
      params.set('ex', this.exclude.join(','));
      window.history.replaceState('', '', '?'+params.toString());
    },
    removeExclude(ex: string) {
      this.exclude.splice(this.exclude.indexOf(ex), 1);

      const params = new URLSearchParams(location.search);
      params.set('ex', this.exclude.join(','));
      if(this.exclude.length == 0)
        params.delete("ex");
      window.history.replaceState('', '', '?'+params.toString());
    },
    async loadTimetable() {
      this.loading = true;

      const params = new URLSearchParams(location.search);
      const type = params.get('t') || "";
      const cat = params.get('c') || "";
      this.res = await (await fetch(this.apiPath.replace('%t', type).replace('%c', cat).replace('%w', this.weekOffset))).json();
      
      this.days = { 1: [], 2: [], 3: [], 4: [], 5: [] };
      //for(const category of this.res) {
        for(const event of this.res.CategoryEvents[0].Results) {
          let day = new Date(event.StartDateTime).getDay();
          if(!this.days[day])
            this.days[day] = [];

          this.days[day].push(event);
        }
      //}
      for(let day of Object.values(this.days)) {
        day = (day as any).sort((a: any, b: any) => { return new Date(a.StartDateTime).getTime() - new Date(b.StartDateTime).getTime() });
      }

      this.loading = false;
    },
    prevWeek() {
      this.weekOffset--;
      this.loadTimetable();
    },
    nextWeek() {
      this.weekOffset++;
      this.loadTimetable();
    },
    isExcluded(ev: any) {
      return (
        this.exclude.some((v: string) => { return ev.Name.toLowerCase().indexOf(v.toLowerCase()) >= 0 }) ||
        this.exclude.some((v: string) => { return ev.EventType.toLowerCase().indexOf(v.toLowerCase()) >= 0 }) ||
        this.exclude.some((v: string) => { return ev.Location.toLowerCase().indexOf(v.toLowerCase()) >= 0 })
      )
    }
  },
  async created() {
    document.addEventListener("keydown", (ev: KeyboardEvent) => {
      if(ev.key == "Escape") {
        this.showDetails = false;
        this.showSettings = false;
      }
    })

    const params = new URLSearchParams(location.search);
    this.exclude = (params.get('ex')?.split(","))?.filter(ex => ex.length != 0) || [];
    if(params.has('t') && params.has('c')) {
      this.page = 'timetable';

      this.loadTimetable();

      this.loaded = true;
    } else {
      this.types = await (await fetch(this.typesPath)).json();
      this.typesEx = await (await fetch(this.typesExPath)).json();
    }
  }
});
</script>

<template>
  <template v-if="page == 'types'">
    <h1>Select a timetable type</h1>
    <div class="type" v-for="t of types" :class="{ locked: selectedType != '', active: t.CategoryTypeId == selectedType }" @click="selectType(t.CategoryTypeId)">
      <span>{{ t.Name }}</span>
    </div>
    <!-- <template v-if="selectedType != ''">
      <br><br>
      <h1>Select {{ typesEx.find(t => t.Identity == selectedType).ParentCategoryTypeIdentities[0].Name }}</h1>
      <input ref="excludeInput" v-model="depSearch" placeholder="Search"><br>
      <div class="type" v-for="d of deps.filter(_d => _d.Name.toLowerCase().includes(depSearch.toLowerCase()))" :class="{ locked: selectedDep != '', active: d.Identity == selectedDep }" @click="selectDep(d.Identity)">
        <span>{{ d.Name }}</span>
      </div>
      <div class="type" v-if="deps.filter(_d => _d.Name.toLowerCase().includes(depSearch.toLowerCase())).length == 0">
        <span>No results.</span>
      </div>
    </template> -->
    <template v-if="/*selectedDep != ''*/ selectedType != ''">
      <br><br>
      <h1>Select timetable</h1>
      <input ref="excludeInput" v-model="catSearch" placeholder="Search"><br>
      <div class="type" v-for="c of cats.filter((_c: any) => _c.Name.toLowerCase().includes(catSearch.toLowerCase()))" :class="{ locked: selectedCat != '', active: c.Identity == selectedCat }" @click="selectCat(c.Identity)">
        <span>{{ c.Name }}</span>
      </div>
      <div class="type" v-if="cats.filter((_c: any) => _c.Name.toLowerCase().includes(catSearch.toLowerCase())).length == 0">
        <span>No results.</span>
      </div>
    </template>
  </template>

  <template v-if="page == 'timetable'">
    <h1>Week commencing {{ startOfWeek(weekOffset).toLocaleDateString() }}</h1>
    <span class="material-icons settings" @click="showSettings = true">settings</span>
    <span class="material-icons prevWeek" @click="prevWeek()">chevron_left</span>
    <span class="material-icons nextWeek" @click="nextWeek()">chevron_right</span>
    <div class="timetable" v-if="loaded">
      <div class="day" v-for="(day, idx) of days">
        <b>{{ dayString(idx) }}</b>
        <template v-for="ev in day">
          <div class="event" :class="{ active: detailsEvent == ev.EventIdentity && showDetails }" v-if="!isExcluded(ev)" @click="detailsEvent = ev.EventIdentity; showDetails = true">
            <p class="name">{{ ev.Name }}</p>
            <p class="evType"><span class="material-icons">event</span>{{ ev.EventType }}</p>
            <p class="time"><span class="material-icons">schedule</span>{{ getTime(ev.StartDateTime) }}-{{ getTime(ev.EndDateTime) }}</p>
            <p class="location"><span class="material-icons">location_on</span>{{ ev.Location }}</p>
          </div>
        </template>
        <template v-if="day.filter((ev:any) => { return !isExcluded(ev) }).length == 0">
          <div class="event">
            <p class="bigText">Nothing on today</p>
          </div>
        </template>
      </div>
    </div>
    <span class="loader" :class="{ visible: loading }"></span>

    <div class="details" :class="{ show: showDetails || showSettings }">
      <span class="material-icons close" @click="showDetails = false; showSettings = false">close</span>
      <template v-if="detailsEvent != '' && !showSettings">
          <p class="name">{{ detailsEv.Name }}</p>
          <p class="evType item"><span class="material-icons">event</span>{{ detailsEv.EventType }}</p>
          <p class="time item"><span class="material-icons">schedule</span>{{ dayString(new Date(detailsEv.StartDateTime).getDay()) }} {{ getTime(detailsEv.StartDateTime) }}-{{ getTime(detailsEv.EndDateTime) }}</p>
          <p class="location item"><span class="material-icons">location_on</span><span v-for="loc of detailsEv.Location.split(/(?<=,)/g)">{{ loc }}</span></p>
      </template>
      <template v-if="showSettings">
          <p class="name">Settings</p>
          <p class="item">Excluded terms:
            <input ref="excludeInput" @keydown.enter="addExclude()" placeholder="Enter a term...">
            <br>
            <span class="excluded" v-for="ex of exclude" @click="removeExclude(ex)">{{ ex }} <span class="material-icons">close</span></span>
          </p>
      </template>
    </div>
  </template>
</template>

<style scoped>
h1 {
  padding: 8px;
  margin-right: 132px;
  line-height: 1.1;
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
  background: rgba(0,0,0,0.25);
}
.loader:after {
  content: '';
  position: fixed;
  top: 50%;
  left: 50%;
  translate: -50% -50%;
  width: 24px;
  height: 24px;
  border: 2px solid #FFF;
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
@keyframes rotation {
  0% {
    rotate: 0deg;
  }
  100% {
    rotate: 360deg;
  }
} 

.type {
  height: 128px;
  width: 256px;
  display: inline-block;
  box-sizing: border-box;
  margin: 8px;
  background: #2e2e2e;
  padding: 8px;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s, opacity 0.2s;
  border: 1px solid #3e3e3e;
}
.type span {
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
.type:hover {
  box-shadow: 0px 2px 8px rgba(0,0,0,0.5);
}
.type:active, .type.active {
  box-shadow: 0px 2px 4px rgba(0,0,0,0.5);
}
.type.locked {
  opacity: 0.5;
  /* pointer-events: none; */
}
.type.active {
  border-color: aquamarine;
  opacity: 1;
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
  width: 100%;
  overflow: auto;
}
.day {
  max-height: 100%;
  flex: 1;
  margin: 4px;
}
.event {
  height: 128px;
  box-sizing: border-box;
  margin: 8px 0px;
  background: #2e2e2e;
  padding: 8px;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
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
.event:hover {
  box-shadow: 0px 2px 8px rgba(0,0,0,0.5);
}
.event:active, .event.active {
  box-shadow: 0px 2px 4px rgba(0,0,0,0.5);
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
  color: #aaa;
  position: absolute;
  right: 8px;
  top: 8px;
  line-height: 1;
}
.event .evType {
  font-size: 12px;
  color: #aaa;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.event .evType, .event .location {
  font-size: 12px;
  color: #aaa;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.details {
  position: fixed;
  top: 0;
  right: 0;
  width: 480px;
  height: 100%;
  background-color: #2e2e2e;
  border-left: 1px solid #3e3e3e;
  box-shadow: 0px 0px 8px rgba(0,0,0,0.5);
  translate: 100%;
  transition: translate 0.3s;
  box-sizing: border-box;
  padding: 16px 0px;
  max-width: 100%;
}
.details.show {
  translate: 0;
}
.details .close {
  position: absolute;
  top: 8px;
  right: 8px;
  margin: 0;
  padding: 8px;
  background-color: rgba(0,0,0,0.1);
  border-radius: 32px;
  font-size: 24px;
  user-select: none;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}
.details .close:hover {
  background-color: rgba(0,0,0,0.2);
  color: white;
}
.details .close:active {
  background-color: rgba(0,0,0,0.15);
  color: white;
}
.details .name {
  font-size: 20px;
  font-weight: bold;
  padding: 0px 56px 0px 16px;
}
.details .item {
  border-top: 1px solid #3e3e3e;
  border-bottom: 1px solid #3e3e3e;
  padding: 8px 16px;
  margin: -1px 0px;
}
.details .location > span {
  display: inline-block;
}

.settings {
  position: absolute;
  top: 8px;
  right: 8px;
  margin: 0;
  padding: 8px;
  background-color: rgba(0,0,0,0.1);
  border-radius: 32px;
  font-size: 24px;
  user-select: none;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}
.settings:hover {
  background-color: rgba(0,0,0,0.2);
  color: white;
}
.settings:active {
  background-color: rgba(0,0,0,0.15);
  color: white;
}
input {
  outline: none;
  border: none;
  font-size: 12px;
  background:#1e1e1e;
  padding: 8px 12px;
  border-radius: 4px;
  margin: 4px 8px;
  width: 256px;
  box-sizing: border-box;
  display: inline-block;
}
.excluded {
  font-size: 12px;
  background:#1e1e1e;
  padding: 4px 8px;
  border-radius: 4px;
  margin: 8px 4px 0px 0px;
  display: inline-block;
  user-select: none;
  cursor: pointer;
}
.excluded:hover {
  opacity: 0.85;
}
.excluded:active {
  opacity: 0.75;
}
.excluded .material-icons {
  margin: 0px 0px 0px 4px;
  font-size: 16px;
  vertical-align: middle;
}

.prevWeek, .nextWeek {
  position: absolute;
  top: 8px;
  right: 56px;
  margin: 0;
  padding: 8px;
  background-color: rgba(0,0,0,0.1);
  border-radius: 32px;
  font-size: 24px;
  user-select: none;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}
.prevWeek {
  right: 104px;
}
.prevWeek:hover, .nextWeek:hover {
  background-color: rgba(0,0,0,0.2);
  color: white;
}
.prevWeek:active, .nextWeek:active {
  background-color: rgba(0,0,0,0.15);
  color: white;
}
</style>

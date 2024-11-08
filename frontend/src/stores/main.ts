import { defineStore } from 'pinia'

export const useMainStore = defineStore('main', () => {
    let wasJustOpened_internal = true;

    function wasJustOpened() {
        let val = wasJustOpened_internal;
        wasJustOpened_internal = false;
        return val;
    }

    return { wasJustOpened };
});
import { Injectable } from '@nestjs/common';
import { getTypesList, getTypesExList, getCatsList, getAllCatEvents, getWeekOffsetCatEvents, getWeekNumberCatEvents, getWeekStartCatEvents } from 'src/common/api-proxy';

@Injectable()
export class ApiV1Service {
  getRoot(): string {
    return 'Timetable API v1';
  }

  getTypes() {
    return getTypesList();
  }

  getTypesEx() {
    return getTypesExList();
  }

  getCats(type: string, page: number) {
    return getCatsList(type, page);
  }

  getAllEvents(type: string, cat: string) {
    return getAllCatEvents(type, cat);
  }

  getWeekOffsetEvents(type: string, cat: string, weekOffset: number) {
    return getWeekOffsetCatEvents(type, cat, weekOffset);
  }

  getWeekNumberEvents(type: string, cat: string, week: number) {
    return getWeekNumberCatEvents(type, cat, week);
  }

  getWeekStartEvents(type: string, cat: string, weekStart: number) {
    return getWeekStartCatEvents(type, cat, weekStart);
  }
}

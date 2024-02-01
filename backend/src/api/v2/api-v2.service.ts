import { Injectable, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { getTypesList, getTypesExList, streamCatsList, getAllCatEvents, getWeekOffsetCatEvents, getWeekNumberCatEvents, getWeekStartCatEvents } from 'src/common/api-proxy';
import { PassThrough } from 'stream';

@Injectable()
export class ApiV2Service {
  getRoot(): string {
    return 'Timetable API v2';
  }

  getTypes() {
    return getTypesList();
  }

  getTypesEx() {
    return getTypesExList();
  }

  getCats(res: Response, type: string)  {
    let stream = new PassThrough();

    streamCatsList(type, stream);
    return new StreamableFile(stream);
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

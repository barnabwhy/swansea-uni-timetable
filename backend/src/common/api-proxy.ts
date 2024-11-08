import { log } from './log';
import { readFile } from 'fs/promises';
import { chunk, formatApiRoute, getStartOfWeek } from './util';
import { ErrorType, APIError } from './errors';
import { PassThrough } from 'stream';

const API_BASE =
  'https://scientia-eu-v4-api-d1-04.azurewebsites.net/api/Public/';
const CATEGORY_PATH =
  'CategoryTypes/Categories/Events/Filter/c0fafdf7-2aab-419e-a69b-bbb9e957303c';
const TYPES_PATH =
  'UserCategoryTypeOptions/c0fafdf7-2aab-419e-a69b-bbb9e957303c?includeBookingAndPersonal=false';
const TYPES_EX_PATH =
  'CategoryTypesExtended/c0fafdf7-2aab-419e-a69b-bbb9e957303c?includeBookingAndPersonal=false';
const CATS_PATH =
  'CategoryTypes/{type}/Categories/FilterWithCache/c0fafdf7-2aab-419e-a69b-bbb9e957303c?pageNumber={page}&query=';

const API_REQ_HEADERS = {
  Authorization: `Anonymous`,
  'Content-Type': 'application/json',
};

interface ApiData {
  categoryBody?: { [key: string]: any };
  weeks: {
    WeekNumber: number;
    WeekLabel: string;
    FirstDayInWeek: string;
  }[];
}

let apiData: ApiData = {
  categoryBody: null,
  weeks: [],
};
getApiData();

// Update API data every 24 hours
setInterval(
  () => {
    getApiData();
  },
  24 * 60 * 60 * 1000,
);

async function getApiData() {
  const categoryBody = JSON.parse(
    await readFile('./category_body.json', { encoding: 'utf8', flag: 'r' }),
  );
  let weeks = [];

  const res = await fetch(
    API_BASE + 'ViewOptions/c0fafdf7-2aab-419e-a69b-bbb9e957303c',
  );
  if (res && res.ok) {
    const data = await res.json();
    categoryBody.ViewOptions.DatePeriods = data.DatePeriods;
    categoryBody.ViewOptions.TimePeriods = data.TimePeriods;

    weeks = data.Weeks;

    log('PROXY', 'Updated API data.');

    apiData = {
      categoryBody,
      weeks,
    };
  } else {
    if (!apiData)
      log(
        'PROXY',
        'Failed to update API data, there exists no previous data to fall back to.',
      );
    else log('PROXY', 'Failed to update API data, using previous data.');
  }
}

// Meta cache stores information such as types and categories
const META_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const metaCache = {
  types: {
    lastUpdated: 0,
    data: null,
  },
  typesEx: {
    lastUpdated: 0,
    data: null,
  },
  cats: {},
};

export interface TimetableFilter {
  Identity: string;
  Values: string[];
}

export interface ViewFilter {
  Name: string;
  DisplayText: string;
  HideDisplayText: boolean;
  Icon?: string;
}

export interface TimetableType {
  IsAdditionalFilter: boolean;
  DefaultFilter: TimetableFilter;
  CategorySelectionLimit: number;
  PageSize: number;
  CacheDurationMins: number;
  SearchFieldRestriction: string[];
  CategoryTypeId: string;
  Name: string;
  ViewDay: ViewFilter[];
  ViewWeek: ViewFilter[];
  ViewMonth: ViewFilter[];
  ViewAgenda: ViewFilter[];
  ViewLanes: ViewFilter[];
  ViewDetails: ViewFilter[];
  ViewExcel: ViewFilter[];
}

export interface CategoryTypeIdentity {
  Identity: string;
  Name?: string;
}

export interface TimetableTypeEx {
  Description: string;
  IsAdditionalFilter: boolean;
  ParentCategoryTypeIdentities: CategoryTypeIdentity[];
  ReadPermissionGroups?: never[];
  WritePermissionGroups?: never[];
  BookPermissionGroups?: never[];
  Identity: string;
  Name: string;
}

export interface TimetableCategory {
  Description: string;
  CategoryTypeIdentity: string;
  CategoryTypeName: string;
  ParentCategoryIdentities: string[];
  ActivityIdentities?: never[];
  ReadPermissionGroups: never[];
  WritePermissionGroups?: never[];
  BookPermissionGroups?: never[];
  RequestPermissionGroups?: never[];
  Identity: string;
  Name: string;
}

export interface PaginatedResults<T> {
  TotalPages: number;
  CurrentPage: number;
  Results: T[];
  Count: number;
}

export interface CategoryEvents {
  CategoryTypeIdentity: string;
  CategoryTypeName: string;
  Identity: string;
  Name: string;
  Results: TimetableEvent[];
}

export interface TimetableEvent {
  IsBooking: boolean;
  BookingInfo: null;
  ResourceInfo: null;
  IsEdited: boolean;
  IsDeleted: boolean;
  EventIdentity: string;
  StartDateTime: string;
  EndDateTime: string;
  UserManuallyAddedEvent: boolean;
  StatusIdentity: string;
  Status: null;
  StatusBackgroundColor: null;
  StatusTextColor: null;
  Identity: string;
  Location: string;
  Description: string;
  HostKey: string;
  Name: string;
  EventType: string;
  Owner: string;
  IsPublished: boolean;
  LastModified: string;
  ParentKey?: string;
  ExtraProperties: EventProperty[];
  StatusName: null;
  Source: null;
  WeekRanges: string;
  WeekLabels: string;
}

export interface EventProperty {
  Name: string;
  DisplayName: string;
  Value: string;
  Rank: number;
}

export interface EventsList {
  CategoryEvents?: CategoryEvents[];
  BookingRequests?: never[];
  PersonalEvents?: never[];
}

/**
 * Get the list of types from the server
 * @returns The list of available types
 */
export async function getTypesList(): Promise<TimetableType[]> {
  // Return from the cache if it's populated
  if (
    metaCache.types.data &&
    Date.now() - metaCache.types.lastUpdated < META_CACHE_EXPIRY
  )
    return metaCache.types.data;

  const res = await fetch(API_BASE + TYPES_PATH, { headers: API_REQ_HEADERS });
  if (res.ok) {
    const data = await res.json();

    // Update meta cache
    metaCache.types.data = data;
    metaCache.types.lastUpdated = Date.now();

    return data;
  } else {
    throw new APIError(ErrorType.REQUEST_FAILED, 'Failed to fetch types');
  }
}

/**
 * Get the list of extended types from the server
 * @returns The list of available extended types
 */
export async function getTypesExList(): Promise<TimetableTypeEx[]> {
  // Return from the cache if it's populated
  if (
    metaCache.typesEx.data &&
    Date.now() - metaCache.typesEx.lastUpdated < META_CACHE_EXPIRY
  )
    return metaCache.typesEx.data;

  const res = await fetch(API_BASE + TYPES_EX_PATH, {
    headers: API_REQ_HEADERS,
  });
  if (res.ok) {
    const data = await res.json();

    // Update meta cache
    metaCache.typesEx.data = data;
    metaCache.typesEx.lastUpdated = Date.now();

    return data;
  } else {
    throw new APIError(
      ErrorType.REQUEST_FAILED,
      'Failed to fetch extended types',
    );
  }
}

const DEFAULT_CATEGORY_SELECTION_LIMIT = 4;

export async function getAllCatEvents(
  type: string,
  cat: string,
  countRequests?: boolean,
  skipInternalCache?: boolean,
): Promise<EventsList> {
  if (!apiData.categoryBody)
    throw new APIError(ErrorType.REQUEST_FAILED, 'Not yet initialised');

  const body = Object.assign({}, apiData.categoryBody);
  body.ViewOptions.Weeks = apiData.weeks;

  return getCatEventsWithBody(type, cat, body, countRequests, skipInternalCache);
}

export async function getWeekOffsetCatEvents(
  type: string,
  cat: string,
  weekOffset: number,
): Promise<EventsList> {
  if (!apiData.categoryBody)
    throw new APIError(ErrorType.REQUEST_FAILED, 'Not yet initialised');

  const body = Object.assign({}, apiData.categoryBody);
  body.ViewOptions.Weeks = [
    { FirstDayInWeek: getStartOfWeek(weekOffset || 0).toISOString() },
  ];

  return getCatEventsWithBody(type, cat, body);
}

export async function getWeekNumberCatEvents(
  type: string,
  cat: string,
  week: number,
): Promise<EventsList> {
  if (!apiData.categoryBody)
    throw new APIError(ErrorType.REQUEST_FAILED, 'Not yet initialised');

  const weekObj: any = apiData.weeks.find((w) => w.WeekNumber == (week || 1));
  if (!weekObj)
    throw new APIError(ErrorType.BAD_REQUEST, 'Invalid week number');

  const body = Object.assign({}, apiData.categoryBody);
  body.ViewOptions.Weeks = [
    { FirstDayInWeek: new Date(weekObj.FirstDayInWeek).toISOString() },
  ];

  return getCatEventsWithBody(type, cat, body);
}

export async function getWeekStartCatEvents(
  type: string,
  cat: string,
  weekStart: number,
): Promise<EventsList> {
  if (!apiData.categoryBody)
    throw new APIError(ErrorType.REQUEST_FAILED, 'Not yet initialised');

  const body = Object.assign({}, apiData.categoryBody);
  body.ViewOptions.Weeks = [
    { FirstDayInWeek: new Date(weekStart).toISOString() },
  ];

  return getCatEventsWithBody(type, cat, body);
}

const CAT_REQUEST_COUNT: { [type: string]: Map<string, number> } = {};

function countCatRequests(type: string, cats: string[]) {
  if (!CAT_REQUEST_COUNT[type]) {
    CAT_REQUEST_COUNT[type] = new Map();
  }

  for (let cat of cats) {
    let reqCount = CAT_REQUEST_COUNT[type].get(cat) ?? 0;
    CAT_REQUEST_COUNT[type].set(cat, reqCount+1);
  }
}

const CAT_EVENT_CACHE_EXPIRY = 5*60*1000; // 5 mins

interface CatEventCache {
  [type: string]: {
    [cat: string]: {
      lastFetched: number;
      events: EventsList;
    };
  }
};

let catEventsCache: CatEventCache = {}

function determinePopularCatThreshold(type: string): number {
  let countsSorted = CAT_REQUEST_COUNT[type].values().toArray().toSorted().reverse();

  if (countsSorted.length == 0)
    return 0;

  if (countsSorted.length < 10)
    return Math.min(countsSorted[0], 5); // Whatever is lower, 5 or the highest count.

  return Math.max(countsSorted[9], 5); // Whatever is higher, 5 or the 10th highest count.
}

async function precachePopularCatEvents() {
  try {
    const startTime = Date.now();
    let numberCached = 0;

    log("PROXY", "Precaching popular events...");

    let newCatEventsCache: CatEventCache = Object.assign({}, catEventsCache);

    // Remove expired entries
    for (let type in newCatEventsCache) {
      for(let cat in newCatEventsCache[type]) {
        if (newCatEventsCache[type][cat].lastFetched < (Date.now() - CAT_EVENT_CACHE_EXPIRY))
          newCatEventsCache[type][cat] = undefined;
      }
    }

    for(let type in CAT_REQUEST_COUNT) {
      let threshold = determinePopularCatThreshold(type);

      if (!newCatEventsCache[type])
        newCatEventsCache[type] = {};

      for(let [cat, count] of CAT_REQUEST_COUNT[type]) {
        CAT_REQUEST_COUNT[type].set(cat, count - Math.floor(threshold / 2));

        if (count >= threshold) {
          newCatEventsCache[type][cat] = {
            lastFetched: Date.now(),
            events: await getAllCatEvents(type, cat, false, true),
          };
          numberCached++;
        }
      }
    }
    catEventsCache = newCatEventsCache;

    log("PROXY", `Finished precaching ${numberCached} popular categories' events in ${(Date.now() - startTime) / 1000}s`);
  }catch (e) {
    log('PROXY', 'Failed to precache popular events: ', e);
  }
}

setInterval(precachePopularCatEvents, 2.5 * 60 * 1000); // Run every 2.5 minutes

function areCatEventsCached(type: string, cat: string): boolean {
  let exists = !!(catEventsCache[type]?.[cat]);
  if (!exists)
    return false;

  let expired = catEventsCache[type][cat].lastFetched < (Date.now() - CAT_EVENT_CACHE_EXPIRY);
  if (expired) {
    catEventsCache[type][cat] = undefined;
  }

  return !expired;
}

function eventMatchesBody(
  event: TimetableEvent,
  body: { [key: string]: any },
): boolean {
  let eventStartDate = new Date(event.StartDateTime);
  let eventEndDate = new Date(event.EndDateTime);

  let isInAnyWeek = false;

  // This is horrifying but it works
  for (let week of body.ViewOptions.Weeks) {
    if (week.FirstDayInWeek) {
      let startOfWeek = new Date(week.FirstDayInWeek);
      let endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      if (eventStartDate.getTime() >= startOfWeek.getTime() && eventStartDate.getTime() <= endOfWeek.getTime()) {
        isInAnyWeek = true;
        break;
      }
      if (eventEndDate.getTime() >= startOfWeek.getTime() && eventEndDate.getTime() <= endOfWeek.getTime()) {
        isInAnyWeek = true;
        break;
      }
    }
  }

  if (!isInAnyWeek)
    return false;

  let isInAnyDay = false;

  for (let day of body.ViewOptions.Days) {
    if (eventStartDate.getDay() == day.DayOfWeek || eventEndDate.getDay() == day.DayOfWeek) {
      isInAnyDay = true;
      break;
    }
  }

  return isInAnyDay;
}

async function getCatEventsWithBody(
  type: string,
  cat: string,
  body: { [key: string]: any },
  countRequests: boolean = true,
  skipInternalCache: boolean = false,
): Promise<EventsList> {
  const cats = cat.split(/[_,]/).map((c) => c.trim());
  const result = {
    CategoryEvents: null,
    BookingRequests: null,
    PersonalEvents: null,
  };

  if (countRequests)
    countCatRequests(type, cats);

  let uncachedCats = cats;

  if (!skipInternalCache) {
    let cachedCats = cats.filter(cat => areCatEventsCached(type, cat));
    uncachedCats = cats.filter(cat => !areCatEventsCached(type, cat));

    for (let cat of cachedCats) {
      const data: EventsList = structuredClone(catEventsCache[type][cat].events);

      if (data.CategoryEvents) {
        // Filter events to those in the selected time
        for (const events of data.CategoryEvents) {
          events.Results = events.Results.filter((event) => eventMatchesBody(event, body));
        }
        result.CategoryEvents = (result.CategoryEvents ?? []).concat(
          data.CategoryEvents,
        );
      }

      // These like don't exist anyway :3
      // if (data.BookingRequests)
      //   result.BookingRequests = (result.BookingRequests ?? []).concat(
      //     data.BookingRequests,
      //   );

      // if (data.PersonalEvents)
      //   result.PersonalEvents = (result.PersonalEvents ?? []).concat(
      //     data.PersonalEvents,
      //   );
    }
  }

  const types = await getTypesList();
  const chunkSize =
    types.find((t) => t.CategoryTypeId == type)?.CategorySelectionLimit ??
    DEFAULT_CATEGORY_SELECTION_LIMIT;

  for (const catWin of chunk(uncachedCats, chunkSize)) {
    body.CategoryTypesWithIdentities = [
      {
        CategoryTypeIdentity: type,
        CategoryIdentities: catWin,
      },
    ];

    try {
      const res = await fetch(API_BASE + CATEGORY_PATH, {
        method: 'POST',
        headers: API_REQ_HEADERS,
        body: JSON.stringify(body),
      });

      const data: EventsList = await res.json();

      if (data.CategoryEvents)
        result.CategoryEvents = (result.CategoryEvents ?? []).concat(
          data.CategoryEvents,
        );

      if (data.BookingRequests)
        result.BookingRequests = (result.BookingRequests ?? []).concat(
          data.BookingRequests,
        );

      if (data.PersonalEvents)
        result.PersonalEvents = (result.PersonalEvents ?? []).concat(
          data.PersonalEvents,
        );
    } catch {
      throw new APIError(ErrorType.REQUEST_FAILED, 'Fetching events failed');
    }
  }

  return result;
}

const MAX_RESULTS_PER_PAGE = 100;
const DEFAULT_PAGE_SIZE = 20;

export async function getCatsList(
  type: string,
  page: number,
): Promise<PaginatedResults<CategoryTypeIdentity>> {
  if (
    metaCache.cats[type] &&
    metaCache.cats[type][page] &&
    metaCache.cats[type][page].data &&
    Date.now() - metaCache.cats[type][page].lastUpdated < META_CACHE_EXPIRY
  )
    return metaCache.cats[type][page].data;

  let results = [];
  let totalResults = Infinity;

  const types = await getTypesList();
  const pageSize =
    types.find((t) => t.CategoryTypeId == type)?.PageSize ?? DEFAULT_PAGE_SIZE;

  const pageTransformFactor = Math.ceil(MAX_RESULTS_PER_PAGE / pageSize);
  let currentPage = (page - 1) * pageTransformFactor + 1;

  while (results.length < MAX_RESULTS_PER_PAGE) {
    try {
      const resp = await fetch(
        API_BASE + formatApiRoute(CATS_PATH, { type, page: currentPage }),
        {
          method: 'POST',
          headers: API_REQ_HEADERS,
        },
      );

      const data = await resp.json();

      totalResults = data.Count;

      if (currentPage > data.TotalPages) break;

      results = results.concat(data.Results);
    } catch (e) {}

    currentPage++;
  }

  const data = {
    TotalPages: Math.ceil(totalResults / (pageSize * pageTransformFactor)),
    CurrentPage: page,
    Results: results,
    Count: totalResults,
  };

  if (!metaCache.cats[type]) metaCache.cats[type] = {};
  if (!metaCache.cats[type][page]) metaCache.cats[type][page] = {};

  metaCache.cats[type][page].data = data;
  metaCache.cats[type][page].lastUpdated = Date.now();

  return data;
}

export async function streamCatsList(type: string, stream: PassThrough) {
  let page = 1;
  let totalPages = 1;
  let totalResults = 0;

  stream.setDefaultEncoding('utf-8');

  stream.write('[');

  while (page <= totalPages) {
    const res = await getCatsList(type, page);

    if (!metaCache.cats[type]) metaCache.cats[type] = {};
    if (!metaCache.cats[type][page]) metaCache.cats[type][page] = {};

    metaCache.cats[type][page].data = res;
    metaCache.cats[type][page].lastUpdated = Date.now();

    totalPages = res.TotalPages;
    page++;

    if (stream.closed) return;

    for (const cat of res.Results) {
      totalResults++;

      stream.cork();

      const chunk = JSON.stringify(cat);
      if (chunk) {
        stream.write(chunk);
      }

      if (totalResults < res.Count) stream.write(',');

      stream.uncork();
    }
  }

  stream.end(']');
}

async function precacheAllTypesCats() {
  try {
    const types = await getTypesList();

    for (const type of types) {
      precacheCats(type.CategoryTypeId);
    }
  } catch (e) {
    log('PROXY', 'Failed to precache types/cats: ', e);
  }
}

precacheAllTypesCats();
setInterval(precacheAllTypesCats, 12 * 60 * 60 * 1000); // Run every 12 hours

async function precacheCats(type: string) {
  const types = await getTypesList();
  const typeName =
    types.find((t) => t.CategoryTypeId == type)?.Name ?? 'name unknown';

  const startTime = Date.now();
  log('PROXY', `Started precaching cats of type "${type}" (${typeName})`);

  let page = 1;
  let totalPages = 1;
  let totalFetched = 0;
  let totalResults = 0;

  while (page <= totalPages) {
    const res = await getCatsList(type, page);

    if (!metaCache.cats[type]) metaCache.cats[type] = {};
    if (!metaCache.cats[type][page]) metaCache.cats[type][page] = {};

    metaCache.cats[type][page].data = res;
    metaCache.cats[type][page].lastUpdated = Date.now();

    totalPages = res.TotalPages;
    totalFetched += res.Results.length;
    totalResults = res.Count;
    page++;
  }
  log(
    'PROXY',
    `Finished precaching cats of type "${type}" (${typeName}) in ${(Date.now() - startTime) / 1000}s | Pages: ${totalPages}, Fetched: ${totalFetched}/${totalResults}`,
  );
}

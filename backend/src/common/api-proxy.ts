import { log } from "./log";
import { readFile } from "fs/promises";
import { chunk, formatApiRoute, getStartOfWeek } from "./util";
import { ErrorType, APIError } from "./errors";

const API_BASE = "https://scientia-eu-v4-api-d1-04.azurewebsites.net/api/Public/";
const CATEGORY_PATH = "CategoryTypes/Categories/Events/Filter/c0fafdf7-2aab-419e-a69b-bbb9e957303c";
const TYPES_PATH = "UserCategoryTypeOptions/c0fafdf7-2aab-419e-a69b-bbb9e957303c?includeBookingAndPersonal=false";
const TYPES_EX_PATH = "CategoryTypesExtended/c0fafdf7-2aab-419e-a69b-bbb9e957303c?includeBookingAndPersonal=false";
const CATS_PATH = "CategoryTypes/{type}/Categories/FilterWithCache/c0fafdf7-2aab-419e-a69b-bbb9e957303c?pageNumber={page}&query=";

const API_REQ_HEADERS = {
    'Authorization': `Anonymous`,
    'Content-Type': 'application/json'
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
setInterval(() => {
    getApiData();
}, 24 * 60 * 60 * 1000);

async function getApiData() {
    let categoryBody = JSON.parse(await readFile('./category_body.json', { encoding: 'utf8', flag: 'r' }));
    let weeks = [];

    let res = await fetch(API_BASE + "ViewOptions/c0fafdf7-2aab-419e-a69b-bbb9e957303c");
    if (res && res.ok) {
        let data = await res.json();
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
            log('PROXY', 'Failed to update API data, there exists no previous data to fall back to.');
        else
            log('PROXY', 'Failed to update API data, using previous data.');
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
    CategoryEvents?: any[];
    BookingRequests?: never[];
    PersonalEvents?: never[]
}

/**
 * Get the list of types from the server
 * @returns The list of available types
 */
export async function getTypesList(): Promise<TimetableType[]> {
    // Return from the cache if it's populated
    if (metaCache.types.data && Date.now() - metaCache.types.lastUpdated < META_CACHE_EXPIRY)
        return metaCache.types.data;

    let res = await fetch(API_BASE + TYPES_PATH, { headers: API_REQ_HEADERS });
    if (res.ok) {
        let data = await res.json();

        // Update meta cache
        metaCache.types.data = data;
        metaCache.types.lastUpdated = Date.now();

        return data;
    } else {
        throw new APIError(ErrorType.REQUEST_FAILED, "Failed to fetch types");
    }
}

/**
 * Get the list of extended types from the server
 * @returns The list of available extended types
 */
export async function getTypesExList(): Promise<TimetableTypeEx[]> {
    // Return from the cache if it's populated
    if (metaCache.typesEx.data && Date.now() - metaCache.typesEx.lastUpdated < META_CACHE_EXPIRY)
        return metaCache.typesEx.data;

    let res = await fetch(API_BASE + TYPES_EX_PATH, { headers: API_REQ_HEADERS });
    if (res.ok) {
        let data = await res.json();

        // Update meta cache
        metaCache.typesEx.data = data;
        metaCache.typesEx.lastUpdated = Date.now();

        return data;
    } else {
        throw new APIError(ErrorType.REQUEST_FAILED, "Failed to fetch extended types");
    }
}

const DEFAULT_CATEGORY_SELECTION_LIMIT = 4;

export async function getAllCatEvents(type: string, cat: string): Promise<EventsList> {
    if (!apiData.categoryBody)
        throw new APIError(ErrorType.REQUEST_FAILED, "Not yet initialised");

    const body = Object.assign({}, apiData.categoryBody);
    body.ViewOptions.Weeks = apiData.weeks;

    return getCatEventsWithBody(type, cat, body);
}

export async function getWeekOffsetCatEvents(type: string, cat: string, weekOffset: number): Promise<EventsList> {
    if (!apiData.categoryBody)
        throw new APIError(ErrorType.REQUEST_FAILED, "Not yet initialised");

    const body = Object.assign({}, apiData.categoryBody);
    body.ViewOptions.Weeks = [{ FirstDayInWeek: getStartOfWeek(weekOffset || 0).toISOString() }];

    return getCatEventsWithBody(type, cat, body);
}

export async function getWeekNumberCatEvents(type: string, cat: string, week: number): Promise<EventsList> {
    if (!apiData.categoryBody)
        throw new APIError(ErrorType.REQUEST_FAILED, "Not yet initialised");

    const weekObj: any = apiData.weeks.find(w => w.WeekNumber == (week || 1));
    if (!weekObj)
        throw new APIError(ErrorType.BAD_REQUEST, "Invalid week number");

    const body = Object.assign({}, apiData.categoryBody);
    body.ViewOptions.Weeks = [{ FirstDayInWeek: new Date(weekObj.FirstDayInWeek).toISOString() }];

    return getCatEventsWithBody(type, cat, body);
}

async function getCatEventsWithBody(type: string, cat: string, body: { [key: string]: any }): Promise<EventsList> {
    let cats = cat.split(',').map(c => c.trim());
    let result = { CategoryEvents: null, BookingRequests: null, PersonalEvents: null };

    let types = await getTypesList();
    let chunkSize = types.find(t => t.CategoryTypeId == type)?.CategorySelectionLimit ?? DEFAULT_CATEGORY_SELECTION_LIMIT;

    for (const catWin of chunk(cats, chunkSize)) {
        body.CategoryTypesWithIdentities = [
            {
                CategoryTypeIdentity: type,
                CategoryIdentities: catWin,
            }
        ];

        try {
            let res = await fetch(API_BASE + CATEGORY_PATH, {
                method: 'POST',
                headers: API_REQ_HEADERS,
                body: JSON.stringify(body),
            });

            let data: EventsList = await res.json();

            if (data.CategoryEvents)
                result.CategoryEvents = (result.CategoryEvents ?? []).concat(data.CategoryEvents);

            if (data.BookingRequests)
                result.BookingRequests = (result.BookingRequests ?? []).concat(data.BookingRequests);

            if (data.PersonalEvents)
                result.PersonalEvents = (result.PersonalEvents ?? []).concat(data.PersonalEvents);
        } catch {
            throw new APIError(ErrorType.REQUEST_FAILED, "Fetching events failed");
        }
    }

    return result;
}

const MAX_RESULTS_PER_PAGE = 100;
const DEFAULT_PAGE_SIZE = 20;

export async function getCatsList(type: string, page: number): Promise<PaginatedResults<CategoryTypeIdentity>> {
    if (metaCache.cats[type] && metaCache.cats[type][page] && metaCache.cats[type][page].data
            && Date.now() - metaCache.cats[type][page].lastUpdated < META_CACHE_EXPIRY)
        return metaCache.cats[type][page].data;

    let results = [];
    let totalResults = Infinity;

    let types = await getTypesList();
    let pageSize = types.find(t => t.CategoryTypeId == type)?.PageSize ?? DEFAULT_PAGE_SIZE;

    const pageTransformFactor = Math.ceil(MAX_RESULTS_PER_PAGE / pageSize);
    let currentPage = (page - 1) * pageTransformFactor + 1;

    while (results.length < MAX_RESULTS_PER_PAGE) {
        try {
            let resp = await fetch(API_BASE + formatApiRoute(CATS_PATH, { type, page: currentPage }), {
                method: 'POST',
                headers: API_REQ_HEADERS,
            });

            let data = await resp.json();

            totalResults = data.Count;

            if (currentPage > data.TotalPages)
                break;

            results = results.concat(data.Results)
        } catch(e) { }

        currentPage++;
    }

    let data = {
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

async function precacheAllTypesCats() {
    try {
        let types = await getTypesList();

        for (const type of types) {
            precacheCats(type.CategoryTypeId);
        }
    } catch(e) {
        console.log("Failed to precache types/cats: ", e)
    }
}

precacheAllTypesCats();
setInterval(precacheAllTypesCats, 12 * 60 * 60 * 1000); // Run every 12 hours

async function precacheCats(type: string) {
    let types = await getTypesList();
    let typeName = types.find(t => t.CategoryTypeId == type)?.Name ?? "name unknown"

    let startTime = Date.now();
    console.log(`Started precaching cats of type "${type}" (${typeName})`);

    let page = 1;
    let totalPages = 1;
    let totalFetched = 0;
    let totalResults = 0;

    while (page <= totalPages) {
        let res = await getCatsList(type, page);

        if (!metaCache.cats[type]) metaCache.cats[type] = {};
        if (!metaCache.cats[type][page]) metaCache.cats[type][page] = {};

        metaCache.cats[type][page].data = res;
        metaCache.cats[type][page].lastUpdated = Date.now();

        totalPages = res.TotalPages;
        totalFetched += res.Results.length;
        totalResults = res.Count;
        page++;
    }
    console.log(`Finished precaching cats of type "${type}" (${typeName}) in ${(Date.now() - startTime) / 1000}s | Pages: ${totalPages}, Fetched: ${totalFetched}/${totalResults}`);
}
import { StreamedList, waitFor } from "./util";

// export const API_BASE = "http://localhost:3000/api/v1/"
export const API_BASE = "https://timetable.swansea.cymru/api/v1/";

export const API_V1 = "api/v1/";
export const API_V2 = "api/v2/";

export async function getTimetableTypes(): Promise<TimetableType[]> {
    let res = await fetch(API_BASE + API_V1 + 'types');
    return await res.json();
}

const CAT_CACHE_EXPIRY = 5 * 60 * 1000;
let catCache: { [key: string]: StreamedList<TimetableCategory> } = {};

export async function getTimetableCats(type: string): Promise<StreamedList<TimetableCategory>> {
    if (catCache[type] && catCache[type].data && Date.now() - catCache[type].lastUpdated < CAT_CACHE_EXPIRY) {
        catCache[type].data.dispatchEvent(new Event('done'));
        return catCache[type].data;
    }

    let streamList = new StreamedList<TimetableCategory>();
    let res = await fetch(API_BASE + API_V2 + `cats/${type}`);

    if (res.body)
        streamList.read(res.body.getReader());
        
    catCache[type] = {
        lastUpdated: Date.now(),
        data: streamList,
    };

    return streamList;
}


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
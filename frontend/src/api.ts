import { waitFor } from "./util";

// export const API_BASE = "http://localhost:3000/api/v1/"
export const API_BASE = "https://timetable.swansea.cymru/api/v1/";

export async function getTimetableTypes(): Promise<TimetableType[]> {
    let res = await fetch(API_BASE + 'types');
    return await res.json();
}

const CAT_CACHE_EXPIRY = 5 * 60 * 1000;
let catCache: { [key: string]: any } = {};

export async function getTimetableCats(type: string, page: number): Promise<PaginatedResults<TimetableCategory>> {
    if (catCache[type] && catCache[type][page] && catCache[type][page].data && Date.now() - catCache[type][page].lastUpdated < CAT_CACHE_EXPIRY) {
        if (page % 5 == 0) {
            return await waitFor(1, catCache[type][page].data);
        } else {
            return catCache[type][page].data;
        }
    }

    let res = await fetch(API_BASE + `cats/${type}/${page}`);
    let data = await res.json();

    if (!catCache[type])
        catCache[type] = {}

    catCache[type][page] = {
        lastUpdated: Date.now(),
        data,
    };

    return data;
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

const express = require('express')
var cors = require('cors')
const app = express()
const port = 80

const apicache = require("apicache");
const fs = require("fs");

app.use(cors())

let cache = apicache.middleware
// app.use(cache('5 minutes'))

const api = {
    auth: "kR1n1RXYhF",
    categoryPath: "https://scientia-eu-v4-api-d1-04.azurewebsites.net/api/Public/CategoryTypes/Categories/Events/Filter/c0fafdf7-2aab-419e-a69b-bbb9e957303c",
    categoryBody: JSON.parse(fs.readFileSync('./catBody.json', { encoding: 'utf8', flag: 'r' })),
    weeks: [],
    typesPath: 'https://scientia-eu-v4-api-d1-04.azurewebsites.net/api/Public/UserCategoryTypeOptions/c0fafdf7-2aab-419e-a69b-bbb9e957303c?includeBookingAndPersonal=false',
    typesExPath: 'https://scientia-eu-v4-api-d1-04.azurewebsites.net/api/Public/CategoryTypesExtended/c0fafdf7-2aab-419e-a69b-bbb9e957303c?includeBookingAndPersonal=false',
    depsPath: 'https://scientia-eu-v4-api-d1-04.azurewebsites.net/api/Public/%t/Categories/FilterWithCache/c0fafdf7-2aab-419e-a69b-bbb9e957303c?pageNumber=%n',
    catsPath: 'https://scientia-eu-v4-api-d1-04.azurewebsites.net/api/Public/CategoryTypes/%t/Categories/FilterWithCache/c0fafdf7-2aab-419e-a69b-bbb9e957303c?pageNumber=%n&query='
}

async function updatePeriods() {
    let res = await fetch("https://scientia-eu-v4-api-d1-04.azurewebsites.net/api/Public/ViewOptions/c0fafdf7-2aab-419e-a69b-bbb9e957303c");
    if (res && res.ok) {
        let data = await res.json();
        api.categoryBody.ViewOptions.DatePeriods = data.DatePeriods;
        api.categoryBody.ViewOptions.TimePeriods = data.TimePeriods;
        api.weeks = data.Weeks;
        console.log("Fetched periods from server")
    }
}

updatePeriods();

setInterval(updatePeriods, 24 * 60 * 60 * 1000);

function getStartOfWeek(offset = 0) {
    let d = new Date(Date.now() + 24 * 3600 * 1000 * 7 * offset);
    const day = d.getDay();

    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setHours(0, 0, 0, 0);
    d.setDate(diff)

    return d;
}

const path = require('path');
const axios = require('axios');

app.use('/assets', express.static('dist/assets'))
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, "/dist/index.html"));
    res.status(200);
})

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

app.get('/types', (req, res) => {
    const url = api.typesPath;

    if (metaCache.types.data && Date.now() - metaCache.types.lastUpdated < META_CACHE_EXPIRY)
        return res.send(metaCache.types.data);

    axios(url, {
        method: 'get',
        headers: {
            'Authorization': `Anonymous`,
            'Content-Type': 'application/json'
        }
    })
        .then(function (response) {
            metaCache.types.data = response.data;
            metaCache.types.lastUpdated = Date.now();

            res.send(response.data);
        })
        .catch(function (error) {
            res.sendStatus(500);
        })
})
app.get('/typesEx', (req, res) => {
    const url = api.typesExPath;

    if (metaCache.typesEx.data && Date.now() - metaCache.typesEx.lastUpdated < META_CACHE_EXPIRY)
        return res.send(metaCache.typesEx.data);

    axios(url, {
        method: 'get',
        headers: {
            'Authorization': `Anonymous`,
            'Content-Type': 'application/json'
        }
    })
        .then(function (response) {
            metaCache.typesEx.data = response.data;
            metaCache.typesEx.lastUpdated = Date.now();

            res.send(response.data);
        })
        .catch(function (error) {
            res.sendStatus(500);
        })
})
app.get('/deps/:type/:page', (req, res) => {

})
app.get('/cats/:type/:page', async (req, res) => {
    if (metaCache.cats[req.params.type] && metaCache.cats[req.params.type][req.params.page] && metaCache.cats[req.params.type][req.params.page].data && Date.now() - metaCache.cats[req.params.type][req.params.page].lastUpdated < META_CACHE_EXPIRY)
        return res.send(metaCache.cats[req.params.type][req.params.page].data);

    try {
        const response = await getTransformedCats(req.params.type, req.params.page);

        if (!metaCache.cats[req.params.type]) metaCache.cats[req.params.type] = {};
        if (!metaCache.cats[req.params.type][req.params.page]) metaCache.cats[req.params.type][req.params.page] = {};

        metaCache.cats[req.params.type][req.params.page].data = response;
        metaCache.cats[req.params.type][req.params.page].lastUpdated = Date.now();

        res.send(response);
    } catch (e) {
        console.log(e)
        res.sendStatus(500);
    }

    // axios(url, {
    //     method: 'post',
    //     headers: {
    //         'Authorization': `Anonymous`,
    //         'Content-Type': 'application/json'
    //     }
    // })
    //     .then(function (response) {
    //         if(!metaCache.cats[req.params.type]) metaCache.cats[req.params.type] = {};
    //         if(!metaCache.cats[req.params.type][req.params.page]) metaCache.cats[req.params.type][req.params.page] = {};

    //         metaCache.cats[req.params.type][req.params.page].data = response.data;
    //         metaCache.cats[req.params.type][req.params.page].lastUpdated = Date.now();

    //         res.send(response.data);
    //     })
    //     .catch(function (error) {
    //         res.sendStatus(500);
    //     })
})

app.get('/:type/:cat/:weekOffset', async (req, res) => {
    const url = api.categoryPath;
    const body = Object.assign({}, api.categoryBody);
    body.ViewOptions.Weeks = [{ FirstDayInWeek: getStartOfWeek(parseInt(req.params.weekOffset) || 0).toISOString() }];

    let cats = req.params.cat.split(',').map(c => c.trim());
    let data = { CategoryEvents: null, BookingRequests: null, PersonalEvents: null };
    for (const catWin of cats.chunk(4)) {
        body.CategoryTypesWithIdentities = [
            {
                CategoryTypeIdentity: req.params.type,
                CategoryIdentities: catWin,
            }
        ];

        try {
            let response = await axios(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Anonymous`,
                    'Content-Type': 'application/json',
                },
                data: JSON.stringify(body),
            });

            if (response.data.CategoryEvents) {
                if (!data.CategoryEvents)
                    data.CategoryEvents = [];

                data.CategoryEvents.push(...response.data.CategoryEvents);
            }
            if (response.data.BookingRequests) {
                if (!data.BookingRequests)
                    data.BookingRequests = [];

                data.BookingRequests.push(...response.data.BookingRequests);
            }
            if (response.data.PersonalEvents) {
                if (!data.PersonalEvents)
                    data.PersonalEvents = [];

                data.PersonalEvents.push(...response.data.PersonalEvents);
            }
        } catch (error) {
            return res.sendStatus(500);
        }
    }

    res.send(data);
})

app.get('/:type/:cat/week/:week', async (req, res) => {
    const url = api.categoryPath;
    const week = api.weeks.find(w => w.WeekNumber == (parseInt(req.params.week) || 0));

    const body = Object.assign({}, api.categoryBody);
    body.ViewOptions.Weeks = [{ FirstDayInWeek: new Date(week.FirstDayInWeek).toISOString() }];

    let cats = req.params.cat.split(',').map(c => c.trim());
    let data = { CategoryEvents: null, BookingRequests: null, PersonalEvents: null };
    for (const catWin of cats.chunk(4)) {
        body.CategoryTypesWithIdentities = [
            {
                CategoryTypeIdentity: req.params.type,
                CategoryIdentities: catWin,
            }
        ];

        try {
            let response = await axios(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Anonymous`,
                    'Content-Type': 'application/json',
                },
                data: JSON.stringify(body),
            });

            if (response.data.CategoryEvents) {
                if (!data.CategoryEvents)
                    data.CategoryEvents = [];

                data.CategoryEvents.push(...response.data.CategoryEvents);
            }
            if (response.data.BookingRequests) {
                if (!data.BookingRequests)
                    data.BookingRequests = [];

                data.BookingRequests.push(...response.data.BookingRequests);
            }
            if (response.data.PersonalEvents) {
                if (!data.PersonalEvents)
                    data.PersonalEvents = [];

                data.PersonalEvents.push(...response.data.PersonalEvents);
            }
        } catch (error) {
            return res.sendStatus(500);
        }
    }

    res.send(data);
})

app.get('/:type/:cat', async (req, res) => {
    const url = api.categoryPath;

    const body = Object.assign({}, api.categoryBody);
    body.ViewOptions.Weeks = api.weeks;

    let cats = req.params.cat.split(',').map(c => c.trim());
    let data = { CategoryEvents: null, BookingRequests: null, PersonalEvents: null };
    for (const catWin of cats.chunk(4)) {
        body.CategoryTypesWithIdentities = [
            {
                CategoryTypeIdentity: req.params.type,
                CategoryIdentities: catWin,
            }
        ];

        try {
            let response = await axios(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Anonymous`,
                    'Content-Type': 'application/json',
                },
                data: JSON.stringify(body),
            });

            if (response.data.CategoryEvents) {
                if (!data.CategoryEvents)
                    data.CategoryEvents = [];

                data.CategoryEvents.push(...response.data.CategoryEvents);
            }
            if (response.data.BookingRequests) {
                if (!data.BookingRequests)
                    data.BookingRequests = [];

                data.BookingRequests.push(...response.data.BookingRequests);
            }
            if (response.data.PersonalEvents) {
                if (!data.PersonalEvents)
                    data.PersonalEvents = [];

                data.PersonalEvents.push(...response.data.PersonalEvents);
            }
        } catch (error) {
            return res.sendStatus(500);
        }
    }

    res.send(data);
})

app.listen(port, () => {
    console.log(`Timetable server listening on port ${port}`)
})

Object.defineProperty(Array.prototype, 'chunk', {
    value: function (chunkSize) {
        var R = [];
        for (var i = 0; i < this.length; i += chunkSize)
            R.push(this.slice(i, i + chunkSize));
        return R;
    }
});

async function getTransformedCats(type, page) {
    let initResp = await fetch(api.catsPath.replace('%t', type).replace('%n', 1), {
        method: 'POST',
        headers: {
            'Authorization': `Anonymous`,
            'Content-Type': 'application/json',
        },
    });

    let initData = await initResp.json();

    // we transform pages to ~100 results because it makes things faster
    let maxResults = 100;

    let results = [];
    let totalResults = 0;

    const pageTransformFactor = Math.ceil(maxResults / initData.Results.length);
    let currentPage = (parseInt(page) - 1) * pageTransformFactor + 1;
    let maxToFetch = Math.min(maxResults, initData.Count - (currentPage - 1) * initData.Results.length);

    while (results.length < maxToFetch) {
        const url = api.catsPath.replace('%t', type).replace('%n', currentPage);
        let resp = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Anonymous`,
                'Content-Type': 'application/json',
            },
        });

        let data = await resp.json();

        results = results.concat(data.Results)
        totalResults = data.Count;

        currentPage++;
    }

    return {
        TotalPages: Math.ceil(totalResults / maxResults),
        CurrentPage: parseInt(page),
        Results: results,
        Count: totalResults,
    };
}

async function precacheAllTypesCats() {
    let typesRes = await fetch(api.typesPath);
    let typesData = await typesRes.json();

    for (const type of typesData) {
        precacheCats(type.CategoryTypeId);
    }
}

precacheAllTypesCats();
setInterval(precacheAllTypesCats, 12 * 60 * 60 * 1000); // Run every 12 hours

async function precacheCats(type) {
    let startTime = Date.now();
    console.log(`Started precaching cats of type "${type}"`);

    let page = 1;
    let totalPages = 1;
    let totalFetched = 0;
    let totalResults = 0;

    while (page <= totalPages) {
        let res = await getTransformedCats(type, page);

        if (!metaCache.cats[type]) metaCache.cats[type] = {};
        if (!metaCache.cats[type][page]) metaCache.cats[type][page] = {};

        metaCache.cats[type][page].data = res;
        metaCache.cats[type][page].lastUpdated = Date.now();

        totalPages = res.TotalPages;
        totalFetched += res.Results.length;
        totalResults = res.Count;
        page++;
    }

    console.log(`Finished precaching cats of type "${type}" in ${(Date.now() - startTime) / 1000}s | Pages: ${totalPages}, Fetched: ${totalFetched}/${totalResults}`);
}
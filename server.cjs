
const express = require('express')
var cors = require('cors')
const app = express()
const port = 80

const apicache = require("apicache");
const fs = require("fs");

app.use(cors())

let cache = apicache.middleware
app.use(cache('5 minutes'))

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
    d.setUTCHours(0, 0, 0, 0);

    return new Date(d.setDate(diff));
}

const path = require('path');
const axios = require('axios');

app.use('/assets', express.static('dist/assets'))
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, "/dist/index.html"));
    res.status(200);
})

app.get('/types', (req, res) => {
    const url = api.typesPath;

    axios(url, {
        method: 'get',
        headers: {
            'Authorization': `Anonymous`,
            'Content-Type': 'application/json'
        }
    })
        .then(function (response) {
            res.send(response.data);
        })
        .catch(function (error) {
            res.sendStatus(500);
        })
})
app.get('/typesEx', (req, res) => {
    const url = api.typesExPath;

    axios(url, {
        method: 'get',
        headers: {
            'Authorization': `Anonymous`,
            'Content-Type': 'application/json'
        }
    })
        .then(function (response) {
            res.send(response.data);
        })
        .catch(function (error) {
            res.sendStatus(500);
        })
})
app.get('/deps/:type/:page', (req, res) => {

})
app.get('/cats/:type/:page', (req, res) => {
    const url = api.catsPath.replace('%t', req.params.type).replace('%n', req.params.page);

    axios(url, {
        method: 'post',
        headers: {
            'Authorization': `Anonymous`,
            'Content-Type': 'application/json'
        }
    })
        .then(function (response) {
            res.send(response.data);
        })
        .catch(function (error) {
            res.sendStatus(500);
        })
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
        } catch(error) {
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
        } catch(error) {
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
        } catch(error) {
            return res.sendStatus(500);
        }
    }

    res.send(data);
})

app.listen(port, () => {
    console.log(`Timetable server listening on port ${port}`)
})

Object.defineProperty(Array.prototype, 'chunk', {
    value: function(chunkSize) {
      var R = [];
      for (var i = 0; i < this.length; i += chunkSize)
        R.push(this.slice(i, i + chunkSize));
      return R;
    }
  });
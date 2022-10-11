
const express = require('express')
var cors = require('cors')
const app = express()
const port = 80

const apicache = require("apicache");

app.use(cors())

let cache = apicache.middleware
app.use(cache('2 minutes'))

const api = {
    auth: "kR1n1RXYhF",
    categoryPath: "https://opentimetables.swan.ac.uk/broker/api/categoryTypes/%c/categories/events/filter",
    categoryBody: `{
        "ViewOptions": { "Weeks": [ { "FirstDayInWeek": "%w" } ] },
        "CategoryIdentities": [
            "%c"
        ]
    }`,
    typesPath: 'https://opentimetables.swan.ac.uk/broker/api/categoryTypeOptions',
    typesExPath: 'https://opentimetables.swan.ac.uk/broker/api/categoryTypesExtended',
    depsPath: 'https://opentimetables.swan.ac.uk/broker/api/CategoryTypes/%t/Categories/Filter?pageNumber=%n',
    catsPath: 'https://opentimetables.swan.ac.uk/broker/api/CategoryTypes/%t/Categories/Filter?pageNumber=%n'
}

function getStartOfWeek(offset = 0) {
    let d = new Date(Date.now() + 24 * 3600 * 1000 * 7 * offset);
    const day = d.getDay();

    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setUTCHours(0, 0, 0, 0);

    return new Date(d.setDate(diff));
}

const path = require('path');
const axios = require('axios');

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, "/dist/index.html"));
    res.status(200);
})
app.use('/', express.static('dist'))

app.get('/types', (req, res) => {
    const url = api.typesPath;

    axios(url, {
        method: 'get',
        headers: {
            'Authorization': `basic ${api.auth}`,
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
            'Authorization': `basic ${api.auth}`,
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
            'Authorization': `basic ${api.auth}`,
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

app.get('/:type/:cat/:weekOffset', (req, res) => {
    const url = api.categoryPath.replace('%c', req.params.type);
    const body = api.categoryBody.replace('%c', req.params.cat).replace('%w', getStartOfWeek(parseInt(req.params.weekOffset) || 0).toISOString());

    axios(url, {
        method: 'post',
        headers: {
            'Authorization': `basic ${api.auth}`,
            'Content-Type': 'application/json'
        },
        data: body
    })
    .then(function (response) {
        res.send(response.data);
    })
    .catch(function (error) {
        res.sendStatus(500);
    })
})

app.listen(port, () => {
  console.log(`Timetable server listening on port ${port}`)
})


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
    categoryBody: fs.readFileSync('./catBody.json', { encoding: 'utf8', flag: 'r' }),
    typesPath: 'https://scientia-eu-v4-api-d1-04.azurewebsites.net/api/Public/UserCategoryTypeOptions/c0fafdf7-2aab-419e-a69b-bbb9e957303c?includeBookingAndPersonal=false',
    typesExPath: 'https://scientia-eu-v4-api-d1-04.azurewebsites.net/api/Public/CategoryTypesExtended/c0fafdf7-2aab-419e-a69b-bbb9e957303c?includeBookingAndPersonal=false',
    depsPath: 'https://scientia-eu-v4-api-d1-04.azurewebsites.net/api/Public/%t/Categories/FilterWithCache/c0fafdf7-2aab-419e-a69b-bbb9e957303c?pageNumber=%n',
    catsPath: 'https://scientia-eu-v4-api-d1-04.azurewebsites.net/api/Public/CategoryTypes/%t/Categories/FilterWithCache/c0fafdf7-2aab-419e-a69b-bbb9e957303c?pageNumber=%n&query='
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

app.get('/:type/:cat/:weekOffset', (req, res) => {
    const url = api.categoryPath;
    const body = api.categoryBody.replace('%c', req.params.cat).replace('%w', getStartOfWeek(parseInt(req.params.weekOffset) || 0).toISOString()).replace('%t', req.params.type);

    axios(url, {
        method: 'post',
        headers: {
            'Authorization': `Anonymous`,
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

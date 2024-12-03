const express = require("express");
const app = express();
const bodyParser = require('body-parser')
const Axios = require('axios');

const PORT = 4006;
const FORGE_CLIENT_ID = "7CMZFMmL22BaEhZSp0Uel052iL5aussd";
const FORGE_CLIENT_SECRET = "RnRA7ThEt0DGPAsK";
var AUTH_URL = "https://developer.api.autodesk.com/authentication/v1/authenticate";

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

const querystring = require('querystring');
var access_token = '';
var scopes = 'data:read data:write data:create bucket:create bucket:read';

app.get('/oauth', function (req, res) {
    Axios({
        method: 'POST',
        url: AUTH_URL,
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
        data: querystring.stringify({
            client_id: FORGE_CLIENT_ID,
            client_secret: FORGE_CLIENT_SECRET,
            grant_type: 'client_credentials',
            scope: scopes
        })
    })
        .then(function (response) {
            // Success
            access_token = response.data.access_token;
            res.send(response.data)
        })
        .catch(function (error) {
            // Failed
            console.log(error);
            res.send('Failed to authenticate');
        });
});


(function start() {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
})();




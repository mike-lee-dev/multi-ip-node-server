const express = require('express')
const app = express()
const port = 3000
const path = require('path');
const openProtocol = require('node-open-protocol');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const { PubSub } = require('@google-cloud/pubsub'); // Imports the Google Cloud client library
const pubSubClient = new PubSub();                    // Creates a PubSub client
const topicName = 'pf6000-telemetry-data';         // PubSub topic name

const controllerConMsg = 'Connected, MID0002';
const httpSuccessMsg = 'IOT data is published into PubSub topic, ' + topicName;
const httpFailedMsg = 'IOT data publishing error; PubSub topic, ' + topicName;

// Create DB connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "multi-ip"
});

db.connect(function(err) {
    if (err) throw err;
    console.log("DB Connected!");
});

app.set('views', __dirname);
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: 'application/*+json' }));

let serverData = [];

function updateServerStatus(ip, port, check_status) {
    var checkDupServer = 0;
    for (var i = 0; i < serverData.length; i++){
        if (serverData[i].ip == ip && serverData[i].port == port){
            serverData[i].status = check_status;
            checkDupServer = 1
            break;
        }
    }
    if (serverData.length == 0 || checkDupServer == 0) {
        serverData.push({ip: ip, port: port, status: check_status});
    }
}

function _liveTightening(ip, port, remove_server=0) {
    let op = openProtocol.createClient(port, ip, (data) => {
        console.log(controllerConMsg, JSON.stringify(data));

        op.subscribe("lastTightening", (err, data) => {
            if (err) {
                updateServerStatus(ip, port, 1);
                return console.log("Error on Subscribe", err);
            }

            updateServerStatus(ip, port, 0);
            console.log("Subscribed!, waiting for the operator to tighten");
        });
    });

    op.on("error", (error) => {
        updateServerStatus(ip, port, 1);
        console.log("Error on OpenProtocol", error);
    });

    op.on("lastTightening", (midData) => {
        updateServerStatus(ip, port, 0);
        console.log("Tightening received!", JSON.stringify(midData));

        const dataBuffer = Buffer.from(JSON.stringify(midData));
        try {
            const messageId = pubSubClient.topic(topicName).publish(dataBuffer);
            console.log(httpSuccessMsg + ' ' + messageId);
        } catch (error) {
            console.error(httpFailedMsg + ' ' + error.message);
            process.exitCode = 1;
        }
    });

    if (remove_server == 1){
        updateServerStatus(ip, port, 1);
    }
    // else {
    //     updateServerStatus(ip, port, 0);
    // }
}

app.get('/', function(req, res) {
    let sql = `SELECT servers.*, connect_status.status FROM servers LEFT JOIN connect_status ON servers.id = connect_status.server_id`;
    db.query(sql, function (err, results) {
        if (err) {
            throw err;
        }
        // for (var i = 0; i < results.length; i ++){
        //     _liveTightening(results[i].ip, parseInt(results[i].port));
        // }
        // console.log(serverData);
        res.render(path.join(__dirname, 'index.ejs'), { serverData: results });
    });
});

app.post('/server_status_check', function (req, res) {
    let sql = `call updateServerStatus(?, ?)`;

    var serverExists = 0;
    var checkStatus = 0;
    var serverStatus = req.body.serverStatus;
    if (serverStatus == 1) {
        _liveTightening(req.body.ip, parseInt(req.body.port));
    }

    for (var i = 0; i < serverData.length; i++){
        if (serverData[i].ip == req.body.ip && serverData[i].port == parseInt(req.body.port)){
            serverExists = 1;
            checkStatus = serverData[i].status;
            break;
        }
    }

    let post = [parseInt(req.body.id), checkStatus];

    db.query(sql, post,function (err, result) {
        if (err) {
            res.redirect('/');
            throw err;
        }
    });

    if (serverExists == 1 && checkStatus == 0) {
        res.end('Connected');
    }
    else {
        res.end('Not Connected');
    }
});

app.post('/server_add', function (req, res) {
    let sql = `call newServerAdd(?, ?)`;
    let post = [req.body.ip_address, req.body.port_number];
    db.query(sql, post,function (err, result) {
        if (err) {
            res.redirect('/');
            throw err;
        }
        if (result[0] == undefined) {
            console.log(`creating connection for ${req.body.ip_address}:${req.body.port_number}`)
            _liveTightening(req.body.ip_address, parseInt(req.body.port_number));
        }
        console.log(serverData);
        res.redirect('/');
    });
});

app.post('/server_remove', function (req, res) {
    let sql = `delete from servers where ip='${req.body.ip_address}' and port='${req.body.port_number}'`;
    db.query(sql, function (err) {
        if (err) {
            res.redirect('/');
            throw err;
        }
        // _liveTightening(req.body.ip_address, parseInt(req.body.port_number), 1);
        // console.log(serverData);
        updateServerStatus(req.body.ip_address, parseInt(req.body.port_number), 1);
        res.redirect('/');
    });
});

app.listen(port, function () {
    app.use(express.static(path.join(__dirname, '/assets')));
    console.log(`app is listening on port ${port}`);
});

setInterval(() => console.log('app is running'), 30000);

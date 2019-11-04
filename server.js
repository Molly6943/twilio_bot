const http = require('http');
const express = require('express');
const axios = require('axios');
const app = express();
const server = http.createServer(app);

const redis = require("redis")
const client = redis.createClient();

const sqlite = require('./async_sqlite.js')

const {promisify} = require('util');
const getRecordAsync = promisify(client.get).bind(client);
const delRecordAsync = promisify(client.del).bind(client)

const WebSocket = require('ws');
var wss = new WebSocket.Server({ server });

async function handleSql () {
  await sqlite.open('./lab4.db')
  
  await sqlite.run(`CREATE TABLE IF NOT EXISTS lab_bot (
    id          INTEGER PRIMARY KEY,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp,
    mykey       TEXT
  );`)

  let list = await sqlite.all(`SELECT * FROM lab_bot`)
  Object.prototype.toString.call(list) === '[object Array]' ? list : [list]
  wss.on('connection', function connection(ws) {
    ws.send(JSON.stringify(list));
    let timerID = setInterval(async () => {
      let mykey = await getRecordAsync('mykey');
       if (mykey) {
        let entry = `NULL,'${new Date()}','${mykey}'`
        let insertSql = 'INSERT INTO lab_bot(id, created_at, mykey) VALUES (' + entry + ')'
        let insertRes = await sqlite.run(insertSql)
        if (insertRes) {
          await delRecordAsync('mykey')
        }
        let row = await sqlite.get(`SELECT * FROM lab_bot ORDER BY id DESC LIMIT 1`)
        ws.send(JSON.stringify([row]));
      }
     }, 10000)
  });

}
handleSql()

app.get('/dashboard', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

server.listen(3000, () => {
  console.log('Express server listening on port 3000');
});


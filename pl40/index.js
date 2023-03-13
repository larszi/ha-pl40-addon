import WebSocket from 'ws';
import mqtt from 'mqtt';
import axios from 'axios';
import FormData from 'form-data';
import express from 'express';

const express = express();


console.log('Init.')
var cookie
var ws
const form = new FormData();

var username = process.env.USERNAME
var password = process.env.PASSWORD

const dashboard_id = process.env.DASHBOARD
console.log('Username. %s', username)
console.log('password. ****')
console.log('Dashboard %s', dashboard_id)

var mqtt_username = process.env.MQTTUSER
var mqtt_password = process.env.MQTTPW
var mqtt_url = process.env.MQTTURL

console.log('MQTT Username. %s', mqtt_username)
console.log('MQTT password. %s', mqtt_password)
console.log('MQTT URL. %s', mqtt_url)

form.append('username', username);
form.append('password', password);

const options = {
  username: mqtt_username,
  password: mqtt_password,
}
//Change this diry shit later! (Reload token after 24h) WatchDog will restart  
function exitPlugin() {
  console.log("Exit Plugin");
  process.exit(1);
}
setTimeout(mainWS, 3600000);


const client  = mqtt.connect(mqtt_url,options)

client.on('connect', function () {
  console.log("connect");
})

const app = express()
const port = 3000


app.get('/watchdog', (req, res) => {
  res.status(200);
  res.send()
})

app.listen(port, () => {
  console.log(`Watchdog Endpoint ${port}`)
})

mainWS();

function mainWS() {
  console.log("Init WS");

  axios.post('https://www.plexlog.de/login/', form, {
    headers: form.getHeaders(),
  }).then(result => {
    
    cookie = result.headers['set-cookie']
    console.log(cookie[0].split('; ')[0]);
  
    ws = new WebSocket('wss://live.plexlog.de/websockets/', {
      headers: {
        Cookie: cookie
       },
      });
      
    ws.on('open', function open() {
      ws.send(dashboard_id);
      ws.send('--heartbeat--');
      setInterval(sendHeartbeat, 2500000, ws)
    });
  
    ws.on('error', function errorFunc(err){
      console.log('websocket error')
      console.log(err)
      mainWS();
    })
  
    function sendHeartbeat(w) {
      w.send('--heartbeat--');
    }

  
  
    ws.on('message', function message(data) {
      var dataraw = data;
  
      var BatterieStand;
      var CurrentPowerSolar;
      var CurrentUsage;
      var CurrentUsageFromNetwork;
      var CurrentBatterieLoadingAmount;
      BatterieStand = dataraw.toString().split(';')[66]
      CurrentPowerSolar = dataraw.toString().split(';')[60]
      CurrentUsage = dataraw.toString().split(';')[64]
      CurrentUsageFromNetwork = dataraw.toString().split(';')[63]
      CurrentBatterieLoadingAmount = dataraw.toString().split(';')[65]
  
      client.publish('solar/BatterieStand', BatterieStand)
      client.publish('solar/CurrentPowerSolar', CurrentPowerSolar.toString())
      client.publish('solar/CurrentUsage', CurrentUsage)
      client.publish('solar/CurrentUsageFromNetwork', CurrentUsageFromNetwork)
      client.publish('solar/CurrentBatterieLoadingAmount', CurrentBatterieLoadingAmount)
  
    });
  });

}



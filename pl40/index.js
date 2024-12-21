import WebSocket from 'ws';
import mqtt from 'mqtt';
import axios from 'axios';
import FormData from 'form-data';
import express from 'express';
import 'log-timestamp';
import log from 'loglevel';


const logLevel = process.env.LOG_LEVEL || 'info';
console.log("Log level set to '%s'", logLevel);
log.setLevel(logLevel);

console.info('Starting up...');


var cookie
var ws
const form = new FormData();



var username = process.env.USERNAME
var password = process.env.PASSWORD

const dashboard_id = process.env.DASHBOARD
console.debug('Username. %s', username)
console.debug('password. ****')
console.debug('Dashboard %s', dashboard_id)

var mqtt_username = process.env.MQTTUSER
var mqtt_password = process.env.MQTTPW
var mqtt_url = process.env.MQTTURL

console.debug('MQTT Username. %s', mqtt_username)
console.debug('MQTT password. %s', mqtt_password)
console.debug('MQTT URL. %s', mqtt_url)

form.append('username', username);
form.append('password', password);

const options = {
  username: mqtt_username,
  password: mqtt_password,
}
//Change this diry shit later! (Reload token after 24h) WatchDog will restart
function exitPlugin() {
  console.info("Exit Plugin");
  process.exit(1);
}
setTimeout(mainWS, 3600000);


const client  = mqtt.connect(mqtt_url,options)

client.on('connect', function () {
  console.info("Successfully connected to MQTT server");
})

const app = express()
const port = 3000


app.get('/watchdog', (req, res) => {
  res.status(200);
  res.send()
})

app.listen(port, () => {
  console.log(`Watchdog endpoint is up and running on port ${port}`)
})

mainWS();

function mainWS() {
  console.info("Initializing WebSocket connection...");

  axios.post('https://www.plexlog.de/login/', form, {
    headers: form.getHeaders(),
  }).then(result => {

    cookie = result.headers['set-cookie']

    ws = new WebSocket('wss://live.plexlog.de/websockets/', {
      headers: {
        Cookie: cookie
       },
      });

    ws.on('open', function open() {
      ws.send(dashboard_id);
      console.info("Send dashboard_id: '%s'", dashboard_id)
      setInterval(sendHeartbeat, 2500000, ws)
    });

    ws.on('error', function errorFunc(err){
      console.error('websocket error')
      console.error(err)
      exit(1);
      mainWS();
    })

    function sendHeartbeat(w) {
      console.debug("send heartbeat")
      w.send('--heartbeat--');
    }



    ws.on('message', function message(data) {
      console.debug('Go Message from WS');
 
      var dataraw = data;

      var BatterieStand;
      var CurrentPowerSolar;
      var CurrentUsage;
      var CurrentUsageFromNetwork;
      var CurrentBatterieLoadingAmount;

      //Only check for data messages
      if(!dataraw.toString().includes('Connected;')) {

      const datarawString = dataraw.toString();
      const lines = datarawString.split('\n');
      const efLines = lines.filter(line => line.startsWith('ef;'));


        if (efLines.length >= 2) {
          const efData2 = efLines[1].split(';');

          BatterieStand = efData2[7]; // soc
          CurrentPowerSolar = efData2[1]; // pwr
          CurrentUsage = efData2[5]; // usg
          CurrentUsageFromNetwork = efData2[4]; // grd
          CurrentBatterieLoadingAmount = efData2[6]; // bat

          console.debug("Got Data WS Message with Solar Power: '%s' and usage: '%s'", CurrentPowerSolar, CurrentUsage);

            client.publish('solar/BatterieStand', BatterieStand);
            client.publish('solar/CurrentPowerSolar', CurrentPowerSolar.toString());
            client.publish('solar/CurrentUsage', CurrentUsage);
            client.publish('solar/CurrentUsageFromNetwork', CurrentUsageFromNetwork);
            client.publish('solar/CurrentBatterieLoadingAmount', CurrentBatterieLoadingAmount);

            console.debug("Published to MQTT");
        }
      }
      else {
        console.debug("Got non Data Message")
      }
    });
  });

}



import WebSocket from 'ws';
import mqtt from 'mqtt';
import axios from 'axios';
import FormData from 'form-data';
import express from 'express';
import 'log-timestamp';
import log from 'loglevel';


const logLevel = process.env.LOG_LEVEL || 'info';
log.log("Log level set to '%s'", logLevel);
log.setLevel(logLevel);

log.info('Starting up...');
log.debug('Debug mode enabled');


var cookie, ws, wsHeartbeat
const form = new FormData();

var heartbeat_msg = process.env.HEARTBEAT_MSG || '--heartbeat--';

var username = process.env.USERNAME
var password = process.env.PASSWORD

const dashboard_id = process.env.DASHBOARD
log.debug('Username. %s', username)
log.debug('password. ****')
log.debug('Dashboard %s', dashboard_id)

var mqtt_username = process.env.MQTTUSER
var mqtt_password = process.env.MQTTPW
var mqtt_url = process.env.MQTTURL

log.debug('MQTT Username. %s', mqtt_username)
log.debug('MQTT password. %s', mqtt_password)
log.debug('MQTT URL. %s', mqtt_url)

form.append('username', username);
form.append('password', password);

const options = {
  username: mqtt_username,
  password: mqtt_password,
}
//Change this diry shit later! (Reload token after 24h) WatchDog will restart
function exitPlugin() {
  log.info("Exit Plugin");
  process.exit(1);
}
setTimeout(mainWS, 3600000);


const client  = mqtt.connect(mqtt_url,options)

client.on('connect', function () {
  log.info("Successfully connected to MQTT server");
})

const app = express()
const port = 3000


app.get('/watchdog', (req, res) => {
  res.status(200);
  res.send()
})

app.listen(port, () => {
  log.log(`Watchdog endpoint is up and running on port ${port}`)
})

mainWS();
var reset_interval = process.env.reset_interval || 'true';
if (reset_interval){
  setInterval(mainWS, 900000, mainWS)
}

function sendHeartbeat(w) {
  log.debug("Send heartbeat")
  w.send(heartbeat_msg);
}

function mainWS() {
  log.info("Initializing/Reseting WebSocket connection...");


  axios.post('https://www.plexlog.de/login/', form, {
    headers: form.getHeaders(),
  }).then(result => {

    cookie = result.headers['set-cookie']

    ws = new WebSocket('wss://live.plexlog.de/websockets/', {
      headers: {
        Cookie: cookie
       },
      });

    wsHeartbeat = new WebSocket('wss://plexlog.de/websockets/', {
      headers: {
        Cookie: cookie
        },
      });

    wsHeartbeat.on('open', function open() {
      log.info("Opened Heartbeat connection")
      setInterval(sendHeartbeat, 54000, wsHeartbeat)
    });

    ws.on('open', function open() {
      ws.send(dashboard_id);
      log.info("Send dashboard_id: '%s'", dashboard_id)
      setInterval(sendHeartbeat, 54000, ws)
      log.info("Successfully connected to WebSocket server");
    });

    ws.on('error', function errorFunc(err){
      log.error('websocket error')
      log.error(err)
      exit(1);
      mainWS();
    })



    ws.on('message', function message(data) {
      log.debug('Go Message from WS');
 
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

          log.debug("Got Data WS Message with Solar Power: '%s' and usage: '%s'", CurrentPowerSolar, CurrentUsage);

            client.publish('solar/BatterieStand', BatterieStand);
            client.publish('solar/CurrentPowerSolar', CurrentPowerSolar.toString());
            client.publish('solar/CurrentUsage', CurrentUsage);
            client.publish('solar/CurrentUsageFromNetwork', CurrentUsageFromNetwork);
            client.publish('solar/CurrentBatterieLoadingAmount', CurrentBatterieLoadingAmount);

            log.debug("Published to MQTT");
        }
      }
      else {
        log.info("Got non data Message / connected message");
      }
    });
  });

}



import WebSocket from 'ws';
import mqtt from 'mqtt';
import axios from 'axios';
import FormData from 'form-data';

console.log('Init.')
var cookie
var ws
const form = new FormData();

var username = process.env.USERNAME
var password = process.env.PASSWORD

const dashboard_id = process.env.DASHBOARD
console.log('Username. %s', username)
console.log('password. %s', password)
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
setTimeout(exitPlugin, 86400000);

const client  = mqtt.connect(mqtt_url,options)

client.on('connect', function () {
  console.log("connect");
})

axios.post('https://www.plexlog.de/login/', form, {
  headers: form.getHeaders(),
}).then(result => {
  // Handle result…
  
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
  });

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

    console.log("------------");
    client.publish('solar/BatterieStand', BatterieStand)
    console.log("BatterieStand %s", BatterieStand);
    client.publish('solar/CurrentPowerSolar', CurrentPowerSolar.toString())
    console.log("CurrentPowerSolar %s", CurrentPowerSolar);
    client.publish('solar/CurrentUsage', CurrentUsage)
    console.log("CurrentUsage %s", CurrentUsage);
    client.publish('solar/CurrentUsageFromNetwork', CurrentUsageFromNetwork)
    console.log("CurrentUsageFromNetwork %s", CurrentUsageFromNetwork);
    client.publish('solar/CurrentBatterieLoadingAmount', CurrentBatterieLoadingAmount)
    console.log("CurrentBatterieLoadingAmount %s", CurrentBatterieLoadingAmount);


  });
});

import WebSocket from 'ws';
import axios from 'axios';


console.log('Init.')
var cookie
var ws
const form = new FormData();

var username = process.env.USERNAME
var password = process.env.PASSWORD
console.log('Username. %s', username)
console.log('password. %s', password)

form.append('username', username);
form.append('password', password);

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
    ws.send('dashboard:9221:2165270087');
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
    console.log("BatterieStand %s", BatterieStand);
    console.log("CurrentPowerSolar %s", CurrentPowerSolar);
    console.log("CurrentUsage %s", CurrentUsage);
    console.log("CurrentUsageFromNetwork %s", CurrentUsageFromNetwork);
    console.log("CurrentBatterieLoadingAmount %s", CurrentBatterieLoadingAmount);
  });
});

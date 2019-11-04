const http = require('http');
const express = require('express');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const axios = require('axios');
const app = express();

const redis = require("redis")
const redisClient = redis.createClient();

const ACCESS_KEY = '0992bc157e108856944f637411645572'

function responseSMS(resp, statusCode, res) {
  const twiml = new MessagingResponse();
  twiml.message(resp);
  return res.status(statusCode).end(twiml.toString())
}

app.post('/sms', (req, res) => {
  let sms = req.query;
  // not sure
  console.log(sms)
  let resp = 'Unkonwn Command'
  try {
    if(sms.text === 'helpme') {
      return responseSMS('Avaiable command: weather', 200, res)
    }else if(sms.text === 'help weather'){
      return responseSMS('Reply the current weather of the city to you. E.g.:  weather New York', 200, res)
    }else if (sms.text.substring(0, 7) === 'weather') {
      let city = sms.text.substring(8)
      let params = {
        access_key: ACCESS_KEY,
        query: city
      }
      //public api request weather info
      axios.get('http://api.weatherstack.com/current', {params})
        .then(response => {
          const apiResponse = response.data;
          resp = `Current temperature in ${apiResponse.location.name} is ${apiResponse.current.temperature}℃`
          return responseSMS(resp, 200, res)
        }).catch(error => {
          resp = 'Please enter the correct city name!'
          return responseSMS(resp, 400, res)
        });
    } else if (sms.text.substring(0, 6) === 'update') {
      redisClient.on('error', function (err) {
        responseSMS(resp, 500, res)
      });
      redisClient.set('mykey', sms.text, (err, reply) => {
        if (reply === 'OK') {
          resp = 'OK'
          responseSMS(resp, 200, res)
        }
      });
    }else {
      return responseSMS(resp, 200, res)
    }
  } catch(err) {
    responseSMS(resp, 400, res)
  }

});

http.createServer(app).listen(1337, () => {
  console.log('Express server listening on port 1337');
});


const express = require('express');
const bodyParser= require('body-parser')
const app = express();
const MongoClient = require('mongodb').MongoClient
var fs = require('fs')
var tools = require('./random')
var weather = require('./weather')
var message = require('./message')
var twilio = require('twilio'),
cronJob = require('cron').CronJob;

var twilioKey = process.env.T_KEY;
var twilioSecret = process.env.T_SECRET;
var myNum = process.env.MY_NUM;

client = twilio(twilioKey, twilioSecret)

var common = require('./common')

configPath = './config.json';
var parsed = JSON.parse(fs.readFileSync(configPath, 'UTF-8'));
console.log(parsed.user)

app.use(bodyParser.urlencoded({extended: true}))

var db
const mongoDetails = 'mongodb://' + parsed.user + ':' + parsed.pass + '@' + parsed.uridetails
MongoClient.connect(mongoDetails, (err, db) => {

  if (err) return console.log(err)
  app.listen(3000, () => {
    console.log('listening on 3000')
  })
})

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

app.get('/edit', (req, res) => {
  res.sendFile(__dirname + '/edit.html')
})

app.get('/delete', (req, res) => {
  res.sendFile(__dirname + '/delete.html')
})

app.get('/verified', (req, res) => {
  res.sendFile(__dirname + '/verified.html')
  MongoClient.connect(mongoDetails, (err, db) => {
    if (err) return console.log(err)

    message.sendMessage(db, client, weather.getWeather)
  })
})

app.get('/edited', (req, res) => {
  res.sendFile(__dirname + '/edited.html')
  MongoClient.connect(mongoDetails, (err, db) => {
    if (err) return console.log(err)

    message.sendMessage(db, client, weather.getWeather)
  })
})

app.get('/deleted', (req, res) => {
  res.sendFile(__dirname + '/deleted.html')
})

app.get('/error', (req, res) => {
  res.sendFile(__dirname + '/error.html')
})

app.get('/already-entered', (req, res) => {
  res.sendFile(__dirname + '/number_exists.html')
})

app.get('/number-not-found', (req, res) => {
  res.sendFile(__dirname + '/number_not_in_db.html')
})

app.get('/header.html', (req, res) => {
  res.sendFile(__dirname + '/header.html')
})

app.get('/google_locations', (req, res) => {
  res.sendFile(__dirname + '/google_locations.js')
})

app.post('/info', (req, res) => {
  var rand = tools.getRand(1000000, 9999999)
  req.body['rand'] = rand.toString()
  console.log(req.body)
  client.sendMessage( { to:req.body['number'], from: myNum, body:'Your verification code is ' + req.body['rand'] + '.'}, (err, data) => {
    console.log( data.body );
  });
  MongoClient.connect(mongoDetails, (err, db) => {
    if (err) return console.log(err)

    var collection = db.collection('info');
    var toFind = {'number': req.body['number']}

    collection.find(toFind).toArray(function (err, items) {
      if (items.length != 0) { //no matches found in db
        res.redirect('/already-entered');
      } else {
        db.collection('info').save(req.body, (err, result) => {
          if (err) return console.log(err)

          console.log('saved to database')
          //res.redirect('/')
        })
      }
    });

  })
})

app.post('/edit-info', (req, res) => {
  var rand = tools.getRand(1000000, 9999999)
  req.body['rand'] = rand.toString()
  console.log(req.body)
  client.sendMessage( { to:req.body['number'], from: myNum, body:'Your verification code is ' + req.body['rand'] + '.'}, (err, data) => {
    console.log( data.body );
  });
  MongoClient.connect(mongoDetails, (err, db) => {
    var collection = db.collection('info');
    var toFind = {'number': req.body['number']}

    collection.find(toFind).toArray(function (err, items) {
      if (items.length == 0) { //no matches found in db
        res.redirect('/number-not-found');
      } else {
        db.collection('verified').remove(toFind, (err, result) => {
          if (err) return console.log(err)

          console.log('removed number from db')
        })

        db.collection('info').remove(toFind, (err, result) => {
          if (err) return console.log(err)

          console.log('removed number from db')
        })

        db.collection('info').save(req.body, (err, result) => {
          if (err) return console.log(err)

          console.log('saved to database')
          //res.redirect('/')
        })
      }
    });
  })
})

app.post('/verify-edit', (req, res) => {
  console.log(req.body)
  MongoClient.connect(mongoDetails, (err, db) => {
    if (err) return console.log(err)

    var collection = db.collection('info');
    var toFind = {'rand': req.body['rand']}
    collection.find(toFind).toArray(function (err, items) {
      if (items.length == 0) { //no matches found in db
        res.redirect('/error');
      } else if (req.body['rand'] == items[0]['rand']) {
        weather.getWeather(req.body['cityLat'], req.body['cityLng'])
        var saved = {'number': items[0]['number'],
                      'city': req.body['city'],
                      'lat': req.body['cityLat'],
                      'long': req.body['cityLng']}
        db.collection('verified').save(saved, (err, result) => {
          if (err) return console.log(err)

          console.log('saved to database as verified')
        })
        res.redirect('/edited')
      } else {
        res.redirect('/error') //entered wrong auth code.
      }
    })
  })
  // res.redirect('/verified')
})

app.post('/delete', (req, res) => {
  var rand = tools.getRand(1000000, 9999999)
  req.body['rand'] = rand.toString()
  console.log(req.body)
  client.sendMessage( { to:req.body['number'], from: myNum, body:'Your verification code is ' + req.body['rand'] + '.'}, (err, data) => {
    console.log( data.body );
  });
  MongoClient.connect(mongoDetails, (err, db) => {
    var collection = db.collection('info');
    var toFind = {'number': req.body['number']}

    collection.find(toFind).toArray(function (err, items) {
      if (items.length == 0) { //no matches found in db
        res.redirect('/number-not-found');
      } else {
        db.collection('info').remove(toFind, (err, result) => {
          if (err) return console.log(err)

          console.log('removed number from info db')
        })

        db.collection('info').save(req.body, (err, result) => {
          if (err) return console.log(err)

          console.log('saved to database')
          //res.redirect('/')
        })
      }
    });
  })
})

app.post('/verify-delete', (req, res) => {
  console.log(req.body)
  MongoClient.connect(mongoDetails, (err, db) => {
    if (err) return console.log(err)

    var collection = db.collection('info');
    var toFind = {'rand': req.body['rand']}
    collection.find(toFind).toArray(function (err, items) {
      if (items.length == 0) { //no matches found in db
        db.collection('info').remove(toFind, (err, result) => {
          if (err) return console.log(err)

          console.log('removed number from info db')
        })
        res.redirect('/error');
      } else if (req.body['rand'] == items[0]['rand']) {
        var saved = {'number': items[0]['number']}
        db.collection('verified').remove(saved, (err, result) => {
          if (err) return console.log(err)

          console.log('removed from verified database')
        })
        db.collection('info').remove(saved, (err, result) => {
          if (err) return console.log(err)

          console.log('removed from verified database')
        })
        res.redirect('/deleted')
      } else {
        res.redirect('/error') //entered wrong auth code.
      }
    })
  })
})

app.post('/verify', (req, res) => {
  console.log(req.body)
  MongoClient.connect(mongoDetails, (err, db) => {
    if (err) return console.log(err)

    var collection = db.collection('info');
    var toFind = {'rand': req.body['rand']}
    collection.find(toFind).toArray(function (err, items) {
      if (items.length == 0) { //no matches found in db
        res.redirect('/error');
      } else if (req.body['rand'] == items[0]['rand']) {
        weather.getWeather(req.body['cityLat'], req.body['cityLng'])
        var saved = {'number': items[0]['number'],
                      'city': req.body['city'],
                      'lat': req.body['cityLat'],
                      'long': req.body['cityLng']}
        db.collection('verified').save(saved, (err, result) => {
          if (err) return console.log(err)

          console.log('saved to database as verified')
        })
        res.redirect('/verified')
      } else {
        res.redirect('/error') //entered wrong auth code.
      }
    })
  })
  // res.redirect('/verified')
})

var textJob = new cronJob( '0 6 * * *', () => {
  client.sendMessage( { to:'YOURPHONENUMBER', from:'YOURTWILIONUMBER', body:'Hello! Hope you’re having a good day!' }, function( err, data ) {});
},  null, true);

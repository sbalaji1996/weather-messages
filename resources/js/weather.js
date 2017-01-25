module.exports = {
  getWeather: (num, city, lat, long, client) => {
    var request = require('request')
    var weatherKey = process.env.W_KEY;
    var myNum = process.env.MY_NUM
    var endpoint = 'https://api.darksky.net/forecast/' + weatherKey + '/' + lat + ',' + long;
    request.get(endpoint, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        var res = JSON.parse(body)['daily']['summary']
        console.log(res)

        setTimeout( () => {
          client.sendMessage( { to: num, from: myNum, body: city + ': ' + res }, function( err, data ) {});
        }, 1000)
      }
    })
  }
}

module.exports = {
  sendMessage: (db, client, callBack) => {

    db.collection('verified').find({}, function(err, resultCursor) {
      resultCursor.each(function(err, result) {
        if (result != null) {
          console.log(result);
          console.log(result['number'])

          callBack(result['number'], result['city'], result['lat'], result['long'], client)
        } else {
          return;
        }
      })
    })
  }
}

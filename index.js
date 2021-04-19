const express = require('express');
const app = express();
const http = require('http').Server(app);
const MongoClient = require('mongodb').MongoClient;

function connectToDb() {
  return new Promise(resolve => {
    const uri = `mongodb+srv://mishimadmin:${process.env.MONGO_PASSWORD}@phansite-archive.xekhf.mongodb.net/archive?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});
    client.connect(err => {
      if (err) return resolve({err: err, db: null});
      resolve({err: null, db: client.db("archive")});
    });
  });
}

(async () => {
  const {err, db} = await connectToDb();

  if (err) {
    return console.error(err);
  }


  const PORT = process.env.PORT || 3000;
  http.listen(PORT, () => {
    console.log('listening on port ' + PORT);
  });
})();
const express = require('express');
const app = express();
const http = require('http').Server(app);
const MongoClient = require('mongodb').MongoClient;
const rateLimit = require("express-rate-limit");
const mustacheExpress = require('mustache-express');

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

  app.use(express.static('public'))
  app.engine('mustache', mustacheExpress());
  app.set('view engine', 'mustache');
  app.set('views', __dirname + '/public/views');
  // limit to 60 requests per minute
  app.use(rateLimit({
    windowMs: 60 * 1000 * 1,
    max: 60
  }));

  app.use(express.urlencoded({extended: false}));
  app.use(express.json());

  app.get('/', (req, res) => {
    res.render('index');
  });

  const PORT = process.env.PORT || 3000;
  http.listen(PORT, () => {
    console.log('listening on port ' + PORT);
  });
})();
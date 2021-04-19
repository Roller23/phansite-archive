// @ts-check
const express = require('express');
const app = express();
const _http = require('http');
const http = new _http.Server(app);
const MongoClient = require('mongodb').MongoClient;
const rateLimit = require("express-rate-limit");
const mustacheExpress = require('mustache-express');

function connectToDb() {
  return new Promise(resolve => {
    const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@phansite-archive.xekhf.mongodb.net/archive?retryWrites=true&w=majority`;
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

  app.get('/', async (req, res) => {
    res.render('index');
  });

  app.get('/userdata/:id', async (req, res) => {
    const id = req.params.id;
    if (!id) {
      return res.json({success: false, msg: 'no user id provided'});
    }
    if (!(/^\d+$/.test(id))) { // check if id contains only digits
      return res.json({success: false, msg: 'invalid user id'});
    }
    const user = await db.collection('users').findOne({id: Number(id)});
    if (!user) {
      return res.json({success: false, msg: 'user not found'});
    }
    delete user._id;
    res.json({success: true, user})
  });

  const PORT = process.env.PORT || 3000;
  http.listen(PORT, () => {
    console.log('listening on port ' + PORT);
  });
})();
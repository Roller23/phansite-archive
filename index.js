require('dotenv').config()
const express = require('express');
const app = express();
const _http = require('http');
const http = new _http.Server(app);
const MongoClient = require('mongodb').MongoClient;
const rateLimit = require("express-rate-limit");
const mustacheExpress = require('mustache-express');
const anchorme = require('anchorme').default;

const connectToDb = () => {
  return new Promise(resolve => {
    const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@phansite-archive.xekhf.mongodb.net/archive?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});
    client.connect(err => {
      if (err) return resolve({err: err, db: null});
      resolve({err: null, db: client.db("archive")});
    });
  });
}

const onlyDigits = str => /^\d+$/.test(str);

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
    const threads = await db.collection('threads').find({}).sort({id: -1}).limit(50).toArray();
    res.render('index', {
      threads
    });
  });

  app.get('/user/:name', async (req, res) => {
    const username = req.params.name;
    const user = await db.collection('users').findOne({username});
    if (!user) {
      return res.render('user404', {username});
    }
    const query = {creator: username};
    const threads = await db.collection('threads').find(query).limit(20).toArray();
    const posts = await db.collection('posts').find(query).limit(20).toArray();
    const postsCount = await db.collection('posts').countDocuments(query);
    const threadsCount = await db.collection('threads').countDocuments(query);
    user.about = anchorme(user.about);
    res.render('user', {
      user, threads, posts, postsCount, threadsCount
    });
  });

  app.get('/userdata/:id', async (req, res) => {
    const id = req.params.id;
    if (!id) {
      return res.json({success: false, msg: 'no user id provided'});
    }
    if (!onlyDigits(id)) {
      return res.json({success: false, msg: 'invalid user id'});
    }
    const user = await db.collection('users').findOne({id: Number(id)});
    if (!user) {
      return res.json({success: false, msg: 'user not found'});
    }
    delete user._id;
    res.json({success: true, user})
  });

  app.get('/threaddata/:id', async (req, res) => {
    const id = req.params.id;
    if (!id) {
      return res.json({success: false, msg: 'no thread id provided'});
    }
    if (!onlyDigits(id)) {
      return res.json({success: false, msg: 'invalid thread id'});
    }
    const idNumber = Number(id);
    const thread = await db.collection('threads').findOne({id: idNumber});
    if (!thread) {
      return res.json({success: false, msg: 'thread not found'});
    }
    delete thread._id;
    const replies = await db.collection('posts').find({thread: idNumber}).toArray();
    for (let reply of replies) {
      delete reply._id;
    }
    thread.replies = replies;
    res.json({success: true, thread})
  });

  const PORT = process.env.PORT || 3000;
  http.listen(PORT, () => {
    console.log('listening on port ' + PORT);
  });
})();
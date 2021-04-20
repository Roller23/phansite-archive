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

const threadsPerPage = 50;

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
    max: 300
  }));

  app.use(express.urlencoded({extended: false}));
  app.use(express.json());

  app.get('/', async (req, res) => {
    const threads = await db.collection('threads').find({}).sort({id: -1}).limit(threadsPerPage).toArray();
    const threadsNumber = 17251;
    const pages = Math.floor((threadsNumber - 1) / threadsPerPage);
    res.render('index', {
      threads,
      showPrev: false,
      showNext: true,
      nextPage: 2
    });
  });

  app.get('/page/:page', async (req, res) => {
    const page = req.params.page;
    if (!onlyDigits(page)) {
      return res.redirect('/');
    }
    const pageNumber = Number(page);
    if (pageNumber <= 1) {
      return res.redirect('/');
    }
    const toSkip = (pageNumber - 1) * 50;
    const threads = await db.collection('threads').find({}).sort({id: -1}).skip(toSkip).limit(threadsPerPage).toArray();
    const threadsNumber = 17251;
    const pages = Math.floor((threadsNumber - 1) / threadsPerPage);
    res.render('index', {
      threads,
      showPrev: true,
      showNext: pageNumber !== (pages + 1),
      prevPage: pageNumber - 1,
      nextPage: pageNumber + 1
    });
  });

  app.get('/user/:name', async (req, res) => {
    const username = req.params.name;
    let user = await db.collection('users').findOne({username});
    if (!user) {
      return res.render('user404', {username});
    }
    const query = {creator: username};
    const threads = await db.collection('threads').find(query).sort({id: -1}).limit(10).toArray();
    const posts = await db.collection('posts').aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: 'threads',
          localField: 'thread',
          foreignField: 'id',
          as: 'postThread'
        }
      }
    ])/*.sort({id: -1})*/.limit(10).toArray();
    if (!user.postCount || !user.threadCount) {
      const postsCount = await db.collection('posts').countDocuments(query);
      const threadsCount = await db.collection('threads').countDocuments(query);
      await db.collection('users').updateOne({username}, {$set: {
        postCount: postsCount, threadCount: threadsCount
      }});
      user = await db.collection('users').findOne({username});
    }
    if (!user.anchoredAbout) {
      const about = user.about ? anchorme(user.about) : null;
      await db.collection('users').updateOne({username}, {$set: {
        anchoredAbout: about
      }});
      user = await db.collection('users').findOne({username});
    }
    res.render('user', {
      user, threads, posts,
      postsCount: user.postCount,
      threadsCount: user.threadCount
    });
  });

  app.get('/thread/:id', async (req, res) => {
    const id = req.params.id;
    if (!onlyDigits(id)) {
      return res.render('thread404');
    }
    const idNumber = Number(id);
    const thread = await db.collection('threads').findOne({id: idNumber});
    if (!thread) {
      return res.render('thread404');
    }
    const replies = await db.collection('posts').find({thread: idNumber}).sort({id: 1}).limit(300).toArray();
    let shortName = thread.name;
    if (shortName.length > 40) {
      shortName = shortName.substr(0, 40) + '...';
    }
    let pages = 1;
    if (thread.posts > 300) {
      pages = Math.floor((thread.posts - 1) / 300);
    }
    const showButtons = pages > 1;
    res.render('thread', {
      thread, replies, shortName, showButtons, pages,
      firstPage: true,
      currentPage: 1,
      showPrev: false,
      showNext: showButtons,
      next: 2
    });
  });

  app.get('/thread/:id/:page', async (req, res) => {
    const id = req.params.id;
    const page = req.params.page;
    if (!onlyDigits(id) || !onlyDigits(page)) {
      return res.render('thread404');
    }
    const idNumber = Number(id);
    const pageNumber = Number(page);
    if (pageNumber <= 1) {
      return res.redirect(`/thread/${idNumber}`);
    }
    const thread = await db.collection('threads').findOne({id: idNumber});
    if (!thread) {
      return res.render('thread404');
    }
    const toSkip = (pageNumber - 1) * 300;
    const replies = await db.collection('posts').find({thread: idNumber}).sort({id: 1}).skip(toSkip).limit(300).toArray();
    let shortName = thread.name;
    if (shortName.length > 40) {
      shortName = shortName.substr(0, 40) + '...';
    }
    let pages = 1;
    if (thread.posts > 300) {
      pages = Math.floor((thread.posts - 1) / 300);
    }
    const showButtons = pages > 1;
    res.render('thread', {
      thread, replies, shortName, showButtons, pages,
      firstPage: false,
      currentPage: pageNumber,
      showPrev: true,
      showNext: pageNumber !== (pages + 1),
      prev: pageNumber - 1,
      next: pageNumber + 1
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
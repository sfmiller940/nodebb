"use strict"

const http         = require('http'),
      env          = process.env,
      path         = require('path'),
      mysql        = require('mysql'),
      express      = require('express'),
      bodyParser   = require('body-parser');

var DB_HOST = env.OPENSHIFT_MYSQL_DB_HOST || 'localhost';
var DB_PORT = env.OPENSHIFT_MYSQL_DB_PORT || '';
var DB_USER = env.OPENSHIFT_MYSQL_DB_USERNAME || 'root';
var DB_PASS = env.OPENSHIFT_MYSQL_DB_PASSWORD || 'root';

//Update to pool.
var con = mysql.createConnection({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASS,
  database: "nodebb"
});

var sendThreads = function(res){
  con.query(
    'SELECT * FROM threads ORDER BY date_posted DESC;',
    function(err,threads){
      if(err) throw console.log( JSON.stringify({ error : err }));
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ threads : threads }));
    }
  );  
};

var app = express();

app
  
  .use([
    bodyParser.json(),
    express.static(path.join(__dirname, 'public')),
  ])

  .get('/health', function(req, res){
    res.writeHead(200);
    res.end();
  })

  .get('/threads', function(req, res){
    sendThreads(res);
  })

  // Combine queries.
  .post('/threads', function(req, res){
    con.query(
      'INSERT INTO threads (username, title) VALUES (?,?);',
      [req.body.username, req.body.title],
      function(err, thread){
        if(err) throw console.log( JSON.stringify({ error : err }));
        con.query(
          'INSERT INTO posts (thread_id, username, body) VALUES (?,?,?);',
          [thread.insertId , req.body.username, req.body.body],
          function(err, post){
            if(err) throw console.log( JSON.stringify({ error : err }));
            sendThreads(res);
          }
        );
      }
    );
  })

  .get('/threads/:thread_id', function(req, res){
    con.query(
      'SELECT * FROM threads WHERE id = ?',
      req.params.thread_id,
      function(err,thread){
        if(err) throw res.end( JSON.stringify({ error : err }));
        con.query(
          'SELECT * FROM posts WHERE thread_id = ? ORDER BY date_posted ASC;',
          req.params.thread_id,
          function(err,posts){
            if(err) throw res.end( JSON.stringify({ error : err }));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ thread : thread[0], posts : posts }));
          }
        );  
      }
    );
  })

  // Combine queries and use date_updated for thread.
  .post('/threads/:thread_id', function(req, res){
    con.query(
      'INSERT INTO posts (thread_id, username, body) VALUES (?,?,?);',
      [req.params.thread_id, req.body.username, req.body.body],
      function(err, post){
        if(err) throw res.end( JSON.stringify({ error : err }));
        con.query(
          'SELECT * FROM posts WHERE thread_id = ? ORDER BY date_posted ASC;',
          req.params.thread_id,
          function(err,posts){
            if(err) throw res.end( JSON.stringify({ error : err }));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ posts : posts }));
          }
        );
      }
    );
  })

  .listen(env.NODE_PORT || 3000, env.NODE_IP || 'localhost');

console.log('Server running.');
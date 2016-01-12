//Modules
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var http = require('http');
//bcrypt for encryption
var bcrypt = require('bcrypt');
var Q = require("q");
var Promise = require("bluebird");
//hat for token
// var hat = require('hat');
//session module
var session = require('express-session');
//get the user model from our db schema
var User = require('./app/models/nerd.js');
var Show = require('./app/models/showModel.js');
var request = require('request');

//connect to local database
var database = 'mongodb://localhost/bugatti';
mongoose.connect(database, function(err, result){
  if(err) return err;
  console.log('Successfully connected to DB');
});

var port = process.env.PORT || 3000;
app.listen(port);
console.log('LISTENING TO PORT' + port);

//to see the requests in console
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());

//shall we require our routes here?
// require('./public/js/appRoutes')

app.use(express.static(__dirname + '/public'));

//settings for session cookie
app.use(session({
  cookieName: 'session',
  secret: 'ILOVEUNICORNS',
  duration: 1000000,
  activeDuration: 300000,
}));


//middleware function to create session for user
var createSession = function(req, res, user){
  return req.session.regenerate(function() {
      //request body tag on session and tag on user
      req.session.user = user;
    });
};

//middleware function for session logic
app.use(function(req, res, next){
  //check if session exists
  if(req.session && req.session.user){
    //find user in db
    User.findOne({username: req.session.user.username}, function(err, user){
      if(user){
        //create session
        createSession(req, res, user);
      }
      //finish middleware and run next function
      next();
    });
  } else {
    next();
  }
});

//middleware function to check if user is logged in
var checkLogin = function(req, res, next){
  if(!req.session.user){
    res.redirect('/login');
  } else {
    next();
  }
};

//GET for signup
app.get('/signup', function(req, res){

});

//GET for main page
app.get('/', checkLogin, function(req, res){
  
});

// GET for logout 
app.get('/logout', checkLogin, function(req, res){
  // session.destroy() to kill session
  req.session.destroy(function(){
      // route to '/login'
      res.redirect('/log');
    });
  }
);

//POST for signup
app.post('/signup', function(req, res){
 
  var username =  req.body.username;

  User.findOne({username: username}).then(function(user){
    if(user){
       res.sendStatus(403);
    } else {
      var userData = {
        username :  req.body.username,
        password :  req.body.password
      }
      //hash password asynchronously 
      bcrypt.hash(userData.password, 10, function(err, hash){
        if (err) {
          throw err;
        }
        //set password to hash
        userData.password = hash;
        //create user in database with mongoose .create()
        User.create(userData, function(err){
          if (err) { 
            console.log(err);
            throw err;
          }
          createSession(req, res, userData);
          res.redirect('/');
        });
      });
    }
  });
});

//POST for login
app.post('/login', function(req, res){
  var user_login = {
    username: req.body.username
  };
  //mongoose .findOne()
  User.findOne(user_login, function(err, user) {
    if (err) throw err;
    //ascyhronous bcrypt compare 
    bcrypt.compare(req.body.password, user.password, function(err, match){
      if (err) throw err;
      //check if the match is true
      if (match){
      user.save();
      console.log('LOGGED IN!');
      //create a session
      createSession(req, res, user);
      //log request
      console.log(req);
      //redirect to main page
      res.redirect('/');
    } else {
      res.send('CANNOT LOG IN!');
    }
    });
  });
});



//for when front end posts to api/shows - this is when the user selects a show to follow
app.post('/api/shows', function(req, response){
  // if(req.session.user) {
    // User.findOne({username: 'kristen'}, function(err){
    //   if(err) throw err;
      request('http://www.omdbapi.com/?i='+req.body.imdbID, function(error, res, body){
        if (error) throw error;
        var data = JSON.parse(body);
        User.update({username: "kristen"}, {$push: {shows: data}}, {upinsert: true}, function(err){
          if(err) {
            console.log('error');
          } else {
            var array = [];
            for(var i = 1; i < 15; i++){
              array[i] = requestShows.bind(null, i, req.body.imdbID);
            // requestShows(i, req.body.imdbID).then(function(data){

            // }) 
              // function(data){
              //   if(data.Season !== undefined){
              //     new Show({
              //       id: req.body.imdbID,
              //       season: data.Season,
              //       episodes: data.Episodes
              //     }).save(function(err, data){
              //       if(err)throw err;
              //     })
            }
      
            Promise.each(array, function(command){
             
              return command().then(function(data){
                console.log(data);
                // if(data.Season !== undefined){
                //   new Show({
                //     id: req.body.imdbID,
                //     season: data.Season,
                //     episodes: data.Episodes
                //   }).save(function(err, data){
                //     if (err) throw err;
                //     console.log('saved');
                //   }).then(function(){
                //     return;
                //   })
                // } else {
                //   return;
                // }
              });
            }).then(function(){
              Show.find({id: req.body.imdbID}, function(err, data){
                if(err){
                  throw err
                } else {
                  console.log(data);
                }
              })
            })
          }
        })
     
            //data.Seasons = 
        response.send(data);
          
      });
});
    // });
  // } else {
  //   res.redirect('/login');
  // }


app.post('/api/dates', function(req, res){
  

})


var requestShows = function(seasonNumber, id){
  return new Promise(function(resolve, reject){
    request('http://www.omdbapi.com?i='+id+"&Season="+ seasonNumber, function(error, res, body){
      if(error){
        reject();
      } else {
        resolve(JSON.parse(body));
      }
    })
  })
}

// new User({
//   username: "kristen",
//   password: 'hi'
// }).save(function(err, data){
//   if(err)throw err
//   console.log('kristen user made');
// })
function promiseWhile(condition, body) {
    var done = Q.defer();

    function loop() {
        // When the result of calling `condition` is no longer true, we are
        // done.
        if (!condition()) return done.resolve();
        // Use `when`, in case `body` does not return a promise.
        // When it completes loop again otherwise, if it fails, reject the
        // done promise
        Q.when(body(), loop, done.reject);
    }

    // Start running the loop in the next tick so that this function is
    // completely async. It would be unexpected if `body` was called
    // synchronously the first time.
    Q.nextTick(loop);

    // The promise
    return done.promise;
}
// var index = 1;
// promiseWhile(function () { return index <= 11; }, function () {
//     console.log(index);
//     index++;
//     return Q.delay(500); // arbitrary async
// }).then(function () {
//     console.log("done");
// }).done();




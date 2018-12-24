const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const shortId = require('shortid');

const cors = require('cors')

const userData = require('./UserProfile.js').UserExerciseData;

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )

app.use(cors())

//app.use(bodyParser.urlencoded({extended: false}))
//app.use(bodyParser.json())
var jsonParseer = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({extended: false});

var timeout = 35000;

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const createUser = require('./UserProfile.js').createUser;
const checkUserName = require('./UserProfile.js').checkUserName;
app.post('/api/exercise/new-user', urlencodedParser, (req, res) => {
  let userName = req.body.username;
  let userID = shortId.generate();

  let createTimeout = setTimeout(()=> {next({message: 'timeout'}) }, timeout)
  checkUserName(userName, (err, checkName) => {
    clearTimeout(createTimeout);
    if (err) {
      return next(err);
    }
    if(checkName == null) {
      createUser({_id: userID, username: userName}, (err, createData) => {

        if(err) {return next(err)};
        console.log("New User created");
        res.json({_id: userID, username: userName});
      });
    }
    else {
      res.send("username already taken");
    }
  });

  //res.json({_id:shortId.generate(), username: req.body.username});
});



// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

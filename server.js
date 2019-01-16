const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const shortId = require('shortid');
const moment = require('moment');

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

const findAllUsers = require('./UserProfile.js').findAllUsers;
app.get('/api/exercise/users', (req, res) => {
  let findUsersTimeout = setTimeout(()=> {next({message: 'timeout'}) }, timeout);
  findAllUsers((err, allUsers) => {
    clearTimeout(findUsersTimeout);
    if(err) {
      return next(err);
    }
    if(allUsers == null) {
      res.send('No users in tracker database');
    }
    else {
      res.send(allUsers);
    }
  });
});

const findID = require('./UserProfile.js').findID;
const findUserIdAndUpdate = require('./UserProfile.js').findUserIdAndUpdate;
app.post('/api/exercise/add', urlencodedParser, (req, res) => {
  let id = req.body.userId;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date;

  console.log('Result of dateval: ' + dateValidator(date));

  if(id === '' || id === ' ') {
    res.send('unknown _id');
  }
  else if(description === '' || description === ' ') {
    res.send('Path `description` is required.');
  }
  else if(duration === '' || duration === ' ') {
    res.send('Path `durations` is required.');
  }
  else {
    let invalidDate = false;

    if(moment(date, 'YYYY-MM-DD').isValid()) {
      date = date;
    }
    else if(date === '' || date === ' ') {
      date = moment().format('YYYY-MM-DD');
    }
    else {
      invalidDate = true;

    }
    if(invalidDate) {
      res.send('Invalid Date');
    }
    else {
      console.log('Dates format: ' + date);
      let addTimeout = setTimeout(()=> {next({message: 'timeout'}) }, timeout);
      findUserIdAndUpdate({id, description, duration, date}, (err, doc) => {
        clearTimeout(addTimeout);
        if(err) {
          //console.log(err);
          res.send(err);
        }
        console.log(doc);
        let formattedDoc = formattedLog(doc);
        res.json(formattedDoc);
      });
    }
  }

});

//GET /api/exercise/log?{userId}[&from][&to][&limit]

let logRoute = '/api/exercise/log\?userId=:id([\w-]+)(?:&from=:from(\d{4}-\d{2}-\d{2}))?(?:&to=:to(\d{4}-\d{2}-\d{2}))?(?:&limit=:limit(\d{2}))?';
//let logRoute = /^\/api\/exercise\/log\?userId=([\w-]+)(?:&from=(\d{4}-\d{2}-\d{2}))?(?:&to=(\d{4}-\d{2}-\d{2}))?(?:&limit=(\d))?$/;
app.get(logRoute, (res, req) =>{
  console.log(req.params.id + ' ' + req.params.from);
  res.send(req.params.id);
});

/*
findID(userID, (err, idInfo) => {
  clearTimeout(addTimeout);
  if(err) {
    return next(err);
  }
  if(idInfo == null) {
    res.send('User id does not exist');
  }
  else {
    res.json({info: idInfo});
  }
});
 */

let formattedLog = (logData) => {
  let logArray = logData.log;
  let newestLog = logArray[logArray.length-1];
  return ({
    "username": logData.username,
    "description": newestLog['description'],
    "duration": newestLog['duration'],
    "_id": logData['_id'],
    "date": moment(newestLog['date']).format('ddd MMM DD YYYY')
  });

}

 let dateValidator = (date) => {
   let regexDate = /^\d{4}\-\d{1,2}\-\d{1,2}$/;
   console.log('is date valid: ' + regexDate.test(date));

   if(regexDate.test(date) == false) {
     return false;
   }
   let dateBrokenApart = date.split('-');
   let year = parseInt(dateBrokenApart[0], 10);
   let month = parseInt(dateBrokenApart[1],10);
   let day = parseInt(dateBrokenApart[2], 10);

   if(year < 1000 || year > 3000 || month < 1 || month > 12) {
     return false;
   }

   let monthLengths = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

   if(year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)) {
     monthLengths[1] = 29;
   }
   console.log(day > 0 && day <= monthLengths[month - 1]);
   return day > 0 && day <= monthLengths[month - 1];
 }

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

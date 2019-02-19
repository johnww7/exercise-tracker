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

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
var jsonParseer = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({extended: false});

var timeout = 35000;

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const createUser = require('./UserProfile.js').createUser;
const checkUserName = require('./UserProfile.js').checkUserName;
//-------------------------------------------------
//Route creates a new users
//-------------------------------------------------
app.post('/api/exercise/new-user', urlencodedParser, (req, res) => {
  let userName = req.body.username;
  let userID = shortId.generate();

  let createTimeout = setTimeout(()=> {next({message: 'timeout'}) }, timeout);
  //Creates new user if name doesn't exist or if user exists sends to webpage
  //user exists
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

});

//----------------------------------------------------------------------------
//Route returns a users log based on the query string parameters in the Route
//which are based on userId, from date, to date and limit of logs returned.
//----------------------------------------------------------------------------
app.get('/api/exercise/log', (req, res) =>{
  let {userId, from, to, limit} = req.query;

  if(userId === "" || userId === " "){
    res.send("unknown userId");
  }
  else {
    var userLog = userData.where({_id: userId});

    //Finds user from query string by userId.
    userLog.findOne((err, data) => {
      if(err) { return next(err);}
      if(data) {
        userLog.select('id username count log');

        //Returns log based on from, to and limit parameters
        if((from !== undefined && moment(from, 'YYYY-MM-DD').isValid())
        && (to !== undefined && moment(from, 'YYYY-MM-DD').isValid())&& limit !== undefined) {
          userLog.exec((err, result) => {
            if(err) { return next(err); }
            //Parse user log with from and to Dates
            let toAndFromLog = dateFinder(result,from, to);
            console.log("array: " + typeof(toAndFromLog));
            //Limit number of logs returned by using Limit
            let logLimit = 0;
            if(parseInt(limit) === 0 || isNaN(parseInt(limit))) {
              //toAndFromLog.length = 0;
              logLimit = toAndFromLog.length;
            }
            else {
              logLimit = parseInt(limit);
            }
            let limitedLog = toAndFromLog.slice(0, logLimit);

            //Return users log
            res.json({
              _id: result.id,
              username: result.username,
              from: moment(from).format('ddd MMM DD YYYY'),
              to: moment(to).format('ddd MMM DD YYYY'),
              count: result.count,
              log: limitedLog
            });
          });

        }
        //Returns user log based on from and to dates
        else if((from !== undefined && moment(from, 'YYYY-MM-DD').isValid()) &&
        (to !== undefined && moment(to, 'YYYY-MM-DD').isValid())) {
          userLog.exec((err, result) => {
            if(err) { return next(err); }
            let toNewLog = dateFinder(result, from, to);

            res.json({
              _id: result.id,
              username: result.username,
              from: moment(from).format('ddd MMM DD YYYY'),
              to: moment(to).format('ddd MMM DD YYYY'),
              count: result.count,
              log: toNewLog
            });
          });
        }
        //Returns user log based on from date.
        else if(from !== undefined && (moment(from, 'YYYY-MM-DD').isValid())){
          userLog.exec((err, result) => {
            if(err) { return next(err); }
            let newLog = result['log'].filter((elem) => {
              return elem.date >= new Date(from);
            }).map((logObj) => {
              return { description: logObj.description, duration: logObj.duration,
                date: moment(logObj.date).format('ddd MMM DD YYYY') };
            });
            res.json({
              _id: result.id,
              username: result.username,
              from: moment(from).format('ddd MMM DD YYYY'),
              count: result.count,
              log: newLog
            });

          });
        }
        else {
          userLog.exec((err, result) => {
            if(err) { return next(err); }
            let formatedLog = result['log'].map((elem) => {
              return { description: elem.description, duration: elem.duration,
                date: moment(elem.date).format('ddd MMM DD YYYY') };
            });
            res.json({_id: result.id, username: result.username,
              count: result.count,
              log: formatedLog});
          });
        }
      }
      else {
        res.send("unknown userId");
      }
    });
  }
});

//-------------------------------------------------------------------
//Returns logs in user log based on from and to date query parameters
//and formats the date
//------------------------------------------------------------------
let dateFinder = (userLog, fromDate, toDate) => {
  let parsedLog = userLog['log'].filter((elem) => {
    return elem.date >= new Date(fromDate) && elem.date <= new Date(toDate);
  }).map((logObj) => {
    return { description: logObj.description, duration: logObj.duration,
      date: moment(logObj.date).format('ddd MMM DD YYYY') };
  });
  return parsedLog;
}

const findAllUsers = require('./UserProfile.js').findAllUsers;
//------------------------------------------------------------------------
//Route returns all users in exercies log Database
//---------------------------------------------------------------------
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
//----------------------------------------------------------------------
//Route creates a new entry into exercise log for a user based on their id.
//Tests to make sure id, description, duration and date fields are filled in
//or are right input
//-----------------------------------------------------------------------
app.post('/api/exercise/add', urlencodedParser, (req, res) => {
  let id = req.body.userId;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date;

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
      let addTimeout = setTimeout(()=> {next({message: 'timeout'}) }, timeout);
      findUserIdAndUpdate({id, description, duration, date}, (err, doc) => {
        clearTimeout(addTimeout);
        if(err) {
          res.send(err);
        }
        let formattedDoc = formattedLog(doc);
        res.json(formattedDoc);
      });
    }
  }

});

//-------------------------------------------------------------
//Formats log received to be sent back to user via webpage
//----------------------------------------------------------
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

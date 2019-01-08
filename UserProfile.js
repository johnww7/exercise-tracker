var mongoose = require('mongoose');
const moment = require('moment');

//mongoose.Promise = global.Promise;
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);

const MONGO_URI = 'mongodb://john:N1teLockon@ds035787.mlab.com:35787/jwfccmongodb';

mongoose.connect(MONGO_URI, {
  keepAlive: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 500,
  connectTimeoutMS: 35000,
  socketTimeoutMS: 40000,
  useNewUrlParser: true
});

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', function callback() {
  console.log('Connected to Mongo Database');
});

let dateValidator = (date) => {
  let regexDate = /^\d{4}\-\d{1,2}\-\d{1,2}$/;

  if(!regexDate.test(date)) {
    return false;
  }
  let dateBrokenApart = date.spilt('-');
  let year = parseInt(dateBrokenApart[0], 10);
  let month = parseInt(dateBrokenApart[1],10);
  let day = parseInt(dateBrokenApart[2], 10);

  if(year < 1000 || year > 3000 || month < 1 || month > 12) {
    return false;
  }
  l
  let monthLengths = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

  if(year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)) {
    monthLengths[1] = 29;
  }
  return day > 0 && day <= monthLengths[month - 1];
}

let dateValidate = [dateValidator, 'Invalid Date'];

//Path `duration` is required.
var LogSchema = mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Path `description` is required.']
  },
  duration: {
    type: Number,
    required: [true, 'Path `duration` is required.']
  },
  date: {
    type: Date,
    default: () => { return new Date() }
    //validate: dateValidate
  }
});
/*log: {
  type: [{
    description: String,
    duration: Number,
    date: {type: Date, default:Date.now}
  }], default: []
}*/
let UserProfile = mongoose.Schema({
  _id: {type:String, trim: true},
  username: {type:String, trim:true, default:''},
  count: {type:Number, trim:true, default: 0},
  log: {
    type: [LogSchema],
    default: []
  },
});

let UserExerciseData = mongoose.model('UserExerciseData', UserProfile);

let createUser = (userEntry, done) => {
  let userToCreate = new UserExerciseData(userEntry);
  userToCreate.save((err, userData) => {
    if(err) { return console.error(err); }
    return done(null, userData);
  });
};

let checkUserName = (checkUser, done) => {
  UserExerciseData.findOne({username: checkUser}, 'username _id', (err, doc) => {
    if(err) { return console.error(err); }
    return done(null, doc);
  });
};

let findAllUsers = (done) => {
  UserExerciseData.find({}, '_id username',(err, entries) => {
    if(err) { return console.log(err); }
    return done(null, entries);
  });
};

let findID = (id, done) => {
  UserExerciseData.findById(id).select('username count log').exec((err, data) => {
    if(err) { return console.log(err); }
    return done(null, data);
  });

/*  UserExerciseData.findOne({_id: id}, '_id', (err, doc) => {
    if (err) { return console.error(err); }
    return done(null, doc);
  });*/
}

let updateOptions = {
  multi: true,
  setDefaultsOnInsert: true,
  new: true,

};

let findUserIdAndUpdate = (logInfo, done) => {
  let dataToUpdate = {
    $push: {log: {description: logInfo.description,
            duration: logInfo.duration, date: logInfo.date}},
    $inc: {count: 1}
  };
  console.log('id for update: ' + logInfo.id + ' : ' + typeof(logInfo.id));
  UserExerciseData.findByIdAndUpdate(logInfo.id, dataToUpdate, updateOptions, (err, updatedData) => {

    if (err) {
      console.log('Mongoose error: ' + err);
      return console.error(err);
    }
    //return done(null, updatedData);
    /*UserExerciseData.findOne({_id: logInfo.id}, 'username log _id', (err, doc) => {
        if (err) { return console.error(err); }
        return done(null, doc);
    });*/
    //console.log('Mongoose update: ' + updatedData);
    return done(null, updatedData);
  });

  /*UserExerciseData.findById(logInfo.id).select('username count log').setOptions(updateOptions)
  .updateOne({ $push: {"log": {description: logInfo.description,
    duration: logInfo.duration, date:logInfo.date}} }, {$inc: {count: 1} }, (err, updatedData) => {
      if (err) { return console.error(err); }
      return done(null, updatedData);
    });*/
}

exports.UserExerciseData = UserExerciseData;
exports.createUser = createUser;
exports.checkUserName = checkUserName;
exports.findAllUsers = findAllUsers;
exports.findID = findID;
exports.findUserIdAndUpdate = findUserIdAndUpdate;

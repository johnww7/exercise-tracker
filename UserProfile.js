var mongoose = require('mongoose');
const moment = require('moment');

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);

//const MONGO_URI = 'mongodb://john:N1teLockon@ds035787.mlab.com:35787/jwfccmongodb';

//Connects to mongodb
mongoose.connect(process.env.MONGO_URI, {
  keepAlive: true,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 500,
  connectTimeoutMS: 35000,
  socketTimeoutMS: 40000,
  useNewUrlParser: true
});

//Tests mongodb connection
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: '));
db.once('open', function callback() {
  console.log('Connected to Mongo Database');
});

//Schema for Log which is a part of UserProfile schema
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
  }
});

//Schema for excerise log user
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

    return done(null, updatedData);
  });

}

exports.UserExerciseData = UserExerciseData;
exports.createUser = createUser;
exports.checkUserName = checkUserName;
exports.findAllUsers = findAllUsers;
exports.findID = findID;
exports.findUserIdAndUpdate = findUserIdAndUpdate;

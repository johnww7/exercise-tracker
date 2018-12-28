var mongoose = require('mongoose');

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

//Path `duration` is required.
var LogSchema = mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

let UserProfile = mongoose.Schema({
  _id: {type:String, trim: true},
  username: {type:String, trim:true, default:''},
  count: {type:Number, trim:true, default: 0},
  log: {
    type: [{
      description: String,
      duration: Number,
      date: {type: Date, default:Date.now}
    }], default: []
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
  UserExerciseData.find({}, '_id username', (err, entries) => {
    if(err) { return console.log(err); }
    return done(null, entries);
  });
};

let findID = (id, done) => {
  UserExerciseData.findOne({_id: id}, '_id', (err, doc) => {
    if (err) { return console.error(err); }
    return done(null, doc);
  });
}

exports.UserExerciseData = UserExerciseData;
exports.createUser = createUser;
exports.checkUserName = checkUserName;
exports.findAllUsers = findAllUsers;

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

/*var LogSchema = mongoose.Schema({
  {description: 'string', duration: 'number', date: 'date'}
});*/

var UserProfile = mongoose.Schema({
  _id: {type:String, trim: true},
  username: {type:String, trim:true, default:''},
  count: {type:Integer, trim:true, default: 0},
  log: {
    type: [{description: String,
    duration: Number,
    date: Date}],
    default: []
  },
});

var UserExerciseData = mongoose.model('UserExerciseData', UserProfile);

var createUser = (userEntry, done) => {
  var userToCreate = new UserExerciseData(userEntry);
  userToCreate.save((err, userData) => {
    if(err) {return console.error(err)};
    return done(null, userData);
  });
};





exports.UserExerciseData = UserExerciesData;
exports.createUser = createUser;

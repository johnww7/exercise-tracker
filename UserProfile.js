var mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URI, {
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
  log: [{
    description: String,
    duration: Number,
    date: Date
  }],
});

var UserExerciseData = mongoose.model('UserExerciseData', UserProfile);

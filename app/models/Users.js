var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
const uniqueValidator = require('mongoose-unique-validator');
var validateEmail = function(Email) {
    var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(Email)
};

var userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  role:{type: String, default:"user"},
  Email: { type: String, required: true, unique: true,
  validate: [validateEmail, 'Please fill a valid email address'],
  match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'] },
  FullName: { type: String},
  Phone_No: { type: Number,min:10,validate: /^\d{10}$/},
  City:{type:String},
  password :String,
  resetPasswordToken: String,
  resetPasswordExpires: Date 
});
userSchema.pre('save', function(next) {
  var user = this;
  var SALT_FACTOR = 5;

  if (!user.isModified('password')) return next();

  bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});
  
userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

userSchema.plugin(passportLocalMongoose);
userSchema.index({createdAt: 1},{expireAfterSeconds: 30});
userSchema.plugin(uniqueValidator, { message: 'Email already in use.' });
userSchema.index({username: 'text', Email: 'text'});
userSchema.index({'$**': 'text'});
 mongoose.model('user', userSchema);
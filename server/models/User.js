const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  profilePic: {
    type: String,
    default: function() {
      return `https://ui-avatars.com/api/?name=${this.username}&background=random&color=fff&size=200`;
    }
  },
  bio: {
    type: String,
    default: '',
    trim: true,
    maxlength: [200, 'Bio cannot exceed 200 characters']
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  refreshToken: {
    type: String,
    select: false
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.followUser = async function(userIdToFollow) {
  if (this.following.includes(userIdToFollow)) {
    throw new Error('Already following this user');
  }
  
  if (this._id.toString() === userIdToFollow.toString()) {
    throw new Error('Cannot follow yourself');
  }
  
  this.following.push(userIdToFollow);
  return this.save();
};

userSchema.methods.unfollowUser = async function(userIdToUnfollow) {
  const index = this.following.indexOf(userIdToUnfollow);
  if (index === -1) {
    throw new Error('Not following this user');
  }
  
  this.following.splice(index, 1);
  return this.save();
};

userSchema.methods.addFollower = async function(followerId) {
  if (!this.followers.includes(followerId)) {
    this.followers.push(followerId);
    return this.save();
  }
  return this;
};

userSchema.methods.removeFollower = async function(followerId) {
  const index = this.followers.indexOf(followerId);
  if (index > -1) {
    this.followers.splice(index, 1);
    return this.save();
  }
  return this;
};

userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshToken;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);

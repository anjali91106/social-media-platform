const User = require('../models/User');
const { verifyAccessToken } = require('../utils/jwtUtils');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId)
      .populate('following', 'username profilePic')
      .populate('followers', 'username profilePic');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token'
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate };

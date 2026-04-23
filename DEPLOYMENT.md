# Deployment Guide

This guide covers deploying the Social Media Platform to production using Render (backend) and Vercel (frontend).

## 🚀 Quick Deployment

### Backend (Render)

1. **Prepare Repository**
   - Ensure all code is pushed to GitHub
   - Remove debug console logs (completed)
   - Environment variables configured

2. **Render Setup**
   - Go to [render.com](https://render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the `server` directory as root
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Node Version: 18.x

3. **Environment Variables**
   Set these in Render dashboard:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
   JWT_ACCESS_SECRET=your-super-secure-access-secret-key-32-chars
   JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-32-chars
   FRONTEND_URL=https://your-app.vercel.app
   ```

### Frontend (Vercel)

1. **Prepare Repository**
   - Ensure all code is pushed to GitHub
   - Remove debug console logs (completed)
   - Vite configuration optimized

2. **Vercel Setup**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Connect your GitHub repository
   - Select the `client` directory as root
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Environment Variables**
   Set these in Vercel dashboard:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   VITE_SOCKET_URL=https://your-backend.onrender.com
   VITE_NODE_ENV=production
   ```

## 📋 Pre-Deployment Checklist

### Backend Optimization ✅
- [x] Removed all debug console.log statements
- [x] Optimized package.json scripts
- [x] Created production environment template
- [x] Configured for Render deployment
- [x] Error handling in place
- [x] Security headers configured

### Frontend Optimization ✅
- [x] Removed all debug console.log statements
- [x] Optimized Vite build configuration
- [x] Created vercel.json configuration
- [x] Code splitting enabled
- [x] Minification configured
- [x] Environment variables configured

### Database Setup
- [ ] MongoDB Atlas cluster created
- [ ] Connection string ready
- [ ] Indexes configured
- [ ] Backup strategy planned

## 🔧 Configuration Files

### Backend Files Created/Modified
- `server/.env.production` - Production environment template
- `server/package.json` - Optimized scripts for deployment

### Frontend Files Created/Modified
- `client/vercel.json` - Vercel deployment configuration
- `client/.env.production` - Production environment template
- `client/vite.config.js` - Optimized build configuration
- `client/package.json` - Added start script

## 🌐 Post-Deployment Steps

### 1. Update URLs
- Update `FRONTEND_URL` in Render environment variables
- Update `VITE_API_URL` and `VITE_SOCKET_URL` in Vercel environment variables

### 2. Test Functionality
- [ ] User registration and login
- [ ] Profile picture upload
- [ ] Post creation with images
- [ ] Follow/unfollow functionality
- [ ] Real-time notifications
- [ ] Search functionality

### 3. Monitor Performance
- Set up monitoring on Render dashboard
- Check Vercel analytics
- Monitor error rates
- Check database performance

## 🐛 Common Issues & Solutions

### Backend Issues
**Port Issues**
- Render automatically assigns PORT
- Use `process.env.PORT || 5000`

**Database Connection**
- Ensure MongoDB URI is correct
- Check network access in MongoDB Atlas
- Verify IP whitelist

**CORS Issues**
- Update FRONTEND_URL environment variable
- Check CORS configuration in server.js

### Frontend Issues
**API Connection**
- Verify VITE_API_URL is correct
- Check if backend URL is accessible
- Ensure CORS is configured properly

**Build Failures**
- Check for syntax errors
- Verify all dependencies are installed
- Check environment variable names

**Socket.io Connection**
- Verify VITE_SOCKET_URL matches backend URL
- Check WebSocket support in production
- Ensure Socket.io server is running

## 📊 Performance Optimization

### Backend
- **Database Indexing**: Ensure proper indexes on queries
- **Rate Limiting**: Configured for 100 requests/15min
- **Compression**: Gzip compression enabled
- **Caching**: Implement Redis if needed

### Frontend
- **Code Splitting**: Automatic with Vite configuration
- **Image Optimization**: Base64 encoding for small images
- **Bundle Size**: Optimized with manual chunks
- **CDN**: Vercel provides automatic CDN

## 🔒 Security Considerations

### Backend Security
- **JWT Tokens**: Secure secrets configured
- **Rate Limiting**: Prevents abuse
- **Input Validation**: Joi schemas in place
- **Helmet**: Security headers configured
- **HTTPS**: Automatic with Render

### Frontend Security
- **Environment Variables**: Sensitive data not exposed
- **XSS Protection**: Built-in React protection
- **CSRF Protection**: Implemented with sameSite cookies

## 📈 Scaling Considerations

### Backend Scaling
- **Horizontal Scaling**: Render supports auto-scaling
- **Database Scaling**: MongoDB Atlas can scale
- **Load Balancing**: Render provides load balancing
- **Monitoring**: Set up alerts for performance metrics

### Frontend Scaling
- **CDN**: Vercel Edge Network
- **Static Assets**: Optimized delivery
- **Caching**: Browser caching configured
- **Analytics**: Monitor performance

## 🔄 CI/CD Pipeline

### Automated Deployment
- **GitHub Integration**: Both platforms connect to GitHub
- **Auto Deploy**: Configure for main branch pushes
- **Preview Deployments**: Vercel provides preview URLs
- **Rollback**: Both platforms support rollbacks

### Testing Pipeline
- **Unit Tests**: Jest configured for backend
- **Integration Tests**: Add as needed
- **E2E Tests**: Consider adding Cypress
- **Code Quality**: ESLint configured

## 📞 Support

### Platform Support
- **Render**: [render.com/docs](https://render.com/docs)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **MongoDB Atlas**: [docs.mongodb.com/atlas](https://docs.mongodb.com/atlas)

### Troubleshooting
- Check logs in both platform dashboards
- Monitor environment variables
- Test API endpoints directly
- Verify database connections

---

**Ready for production deployment! 🎉**

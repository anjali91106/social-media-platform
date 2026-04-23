# Social Media Platform

A full-stack social media application built with modern web technologies, featuring real-time updates, file uploads, and a responsive user interface.

## 🌟 Features

### Core Features
- **User Authentication** - Registration, login, and secure JWT-based authentication
- **Profile Management** - Custom profile pictures, bio, and user settings
- **Social Interactions** - Follow/unfollow users, like posts, and comment system
- **Content Creation** - Create posts with images, captions, tags, and location
- **Real-time Updates** - Live notifications for likes, comments, and follows
- **Search & Discovery** - Search users and posts with smart filtering
- **Responsive Design** - Mobile-first design that works on all devices

### Technical Features
- **Modern Tech Stack** - React 18, Node.js, MongoDB, Socket.io
- **Image Upload** - Profile picture and post image uploads with base64 storage
- **Real-time Communication** - WebSocket-based live updates
- **RESTful API** - Well-documented API endpoints
- **Security** - JWT authentication, input validation, rate limiting
- **Scalable Architecture** - Clean separation of concerns

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern UI framework with hooks
- **Vite 4** - Fast build tool and development server
- **Tailwind CSS 3** - Utility-first CSS framework
- **React Router 6** - Client-side routing
- **Axios** - HTTP client with interceptors
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - Authentication tokens
- **Socket.io** - Real-time WebSocket server
- **Multer** - File upload handling
- **bcryptjs** - Password hashing

### Development Tools
- **Nodemon** - Auto-restart development server
- **ESLint** - Code quality and consistency
- **Git** - Version control

## 📁 Project Structure

```
social-media-platform/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   │   ├── Navigation.jsx
│   │   │   ├── FileUpload.jsx
│   │   │   └── ProfileGrid.jsx
│   │   ├── context/       # React contexts
│   │   │   └── AuthContext.jsx
│   │   ├── pages/         # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── HomeFeed.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── SettingsPage.jsx
│   │   │   └── SearchResults.jsx
│   │   ├── services/      # API services
│   │   │   └── api.js
│   │   └── utils/         # Utility functions
│   ├── .env.example       # Environment variables template
│   ├── package.json       # Dependencies and scripts
│   └── vite.config.js     # Vite configuration
├── server/                # Node.js backend
│   ├── config/           # Configuration files
│   │   ├── database.js   # MongoDB connection
│   │   └── cloudinary.js # Cloudinary config
│   ├── controllers/      # Route controllers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── postsController.js
│   │   └── uploadController.js
│   ├── middlewares/      # Express middleware
│   │   ├── auth.js
│   │   ├── upload.js
│   │   └── errorHandler.js
│   ├── models/          # Mongoose models
│   │   ├── User.js
│   │   ├── Post.js
│   │   └── Comment.js
│   ├── routes/          # API routes
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── posts.js
│   │   └── upload.js
│   ├── utils/           # Utility functions
│   ├── .env.example     # Environment variables template
│   ├── package.json     # Dependencies and scripts
│   └── server.js        # Main server file
├── README.md            # This file
└── .gitignore          # Git ignore file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- MongoDB database (local or cloud)
- Git for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd social-media-platform
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Set up environment variables**

   **Backend (.env)**
   ```env
   MONGODB_URI=mongodb://localhost:27017/social-media-platform
   JWT_ACCESS_SECRET=your-access-secret-key
   JWT_REFRESH_SECRET=your-refresh-secret-key
   FRONTEND_URL=http://localhost:3000
   NODE_ENV=development
   ```

   **Frontend (.env)**
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   VITE_NODE_ENV=development
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```
   The server will run on `http://localhost:5000`

2. **Start the frontend application**
   ```bash
   cd client
   npm run dev
   ```
   The app will run on `http://localhost:3000`

3. **Open your browser** and navigate to `http://localhost:3000`

## 📖 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/auth/refresh-token` | Refresh access token |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/:userId/follow` | Follow a user |
| DELETE | `/api/users/:userId/follow` | Unfollow a user |
| GET | `/api/users/:userId/follow-stats` | Get user stats and relationship |
| GET | `/api/users/search?q=query` | Search users |

### Post Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts` | Create a new post |
| GET | `/api/posts/feed` | Get feed from followed users |
| GET | `/api/posts` | Get all posts |
| GET | `/api/posts/:postId` | Get specific post |
| DELETE | `/api/posts/:postId` | Delete a post |
| POST | `/api/posts/:postId/like` | Like a post |
| DELETE | `/api/posts/:postId/like` | Unlike a post |

### Upload Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/profile` | Upload profile picture |
| POST | `/api/upload/post/images` | Upload post images |

### Request/Response Examples

**Register User**
```javascript
POST /api/auth/register
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Login User**
```javascript
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Create Post**
```javascript
POST /api/posts
Content-Type: multipart/form-data
Authorization: Bearer <token>

FormData:
- media: [image files]
- caption: "My first post!"
- tags: "social,awesome"
- location: "New York"
```

**Upload Profile Picture**
```javascript
POST /api/upload/profile
Content-Type: multipart/form-data
Authorization: Bearer <token>

FormData:
- profilePic: [image file]
```

## 🔧 Configuration

### Backend Configuration

**Database Setup**
- MongoDB connection string in `MONGODB_URI`
- Automatic database index creation on startup
- Connection pooling and error handling

**Authentication**
- JWT access tokens expire in 15 minutes
- Refresh tokens stored in HTTP-only cookies (7 days)
- Secure password hashing with bcrypt (12 rounds)

**File Upload**
- Images stored as base64 in database
- Supported formats: JPG, JPEG, PNG, GIF, WebP
- Maximum file size: 10MB for profile pictures
- Maximum file size: 100MB for post images

### Frontend Configuration

**API Integration**
- Axios interceptors for token management
- Automatic token refresh on expiry
- Error handling with user-friendly messages

**Real-time Features**
- Socket.io connection with authentication
- Live notifications for interactions
- Online user tracking

## 🎨 UI/UX Features

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interface elements

### User Interface
- Clean, modern design with Tailwind CSS
- Consistent color scheme and typography
- Smooth transitions and micro-interactions
- Loading states and error handling

### Accessibility
- Semantic HTML elements
- ARIA labels where appropriate
- Keyboard navigation support
- High contrast ratios

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Protected routes and API endpoints
- Session management with refresh tokens

### Data Protection
- Input validation with Joi schemas
- SQL injection prevention with Mongoose
- XSS protection with proper sanitization
- Rate limiting (100 requests per 15 minutes)

### File Security
- File type validation
- Size limits enforcement
- Secure file handling
- Base64 encoding for storage

## 🔄 Real-time Features

### Socket.io Events

**Client to Server**
- `join:post` - Join post room for updates
- `leave:post` - Leave post room
- `typing:comment` - User typing indicator

**Server to Client**
- `notification` - New notification
- `post:liked` - Post liked notification
- `post:comment_added` - New comment notification
- `user:followed` - New follower notification

### Implementation
```javascript
// Client-side Socket.io connection
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: 'your-jwt-token' }
});

// Listen for notifications
socket.on('notification', (data) => {
  console.log('New notification:', data);
});
```

## 🧪 Testing

### Manual Testing Checklist

**Authentication**
- [ ] User registration works
- [ ] Login with valid credentials
- [ ] Login rejection with invalid credentials
- [ ] Token refresh on expiry
- [ ] Logout functionality

**Profile Management**
- [ ] Profile picture upload
- [ ] Profile picture display
- [ ] Bio update
- [ ] Settings persistence

**Social Features**
- [ ] Follow/unfollow users
- [ ] Follow button shows "Following" state
- [ ] Follower/following counts update
- [ ] Feed shows posts from followed users

**Content Creation**
- [ ] Post creation with images
- [ ] Post deletion
- [ ] Like/unlike posts
- [ ] Comment system

**Real-time Updates**
- [ ] Live notifications
- [ ] Instant feed updates
- [ ] Online status tracking

## 🚀 Deployment

### Production Setup

**Backend Deployment**
1. Set production environment variables
2. Build and start the server
3. Configure reverse proxy (nginx/Apache)
4. Set up SSL certificates
5. Configure MongoDB for production

**Frontend Deployment**
1. Build the React application
2. Serve static files
3. Configure routing
4. Optimize assets
5. Set up CDN if needed

### Environment Variables

**Production (.env)**
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_ACCESS_SECRET=super-secure-access-secret
JWT_REFRESH_SECRET=super-secure-refresh-secret
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style Guidelines
- Follow existing code patterns
- Use descriptive variable names
- Add comments for complex logic
- Keep components small and focused
- Test responsive design

## 🐛 Troubleshooting

### Common Issues

**Server Won't Start**
- Check MongoDB connection string
- Verify environment variables
- Check port availability (5000)

**Frontend Build Errors**
- Clear node_modules and reinstall
- Check environment variables
- Verify API endpoints

**Authentication Issues**
- Check JWT secrets
- Verify token expiration
- Check cookie settings

**File Upload Issues**
- Check file size limits
- Verify supported formats
- Check base64 encoding

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=app:*
NODE_ENV=development
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Socket.io for real-time communication
- MongoDB for the flexible database
- All contributors and users of this platform

## 📞 Support

For support, please:
- Open an issue on GitHub
- Check the troubleshooting section
- Review the API documentation
- Join our community discussions

---

**Built with ❤️ using modern web technologies**

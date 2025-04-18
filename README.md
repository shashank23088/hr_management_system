# HR Management System

A full-stack HR Management System built with React, Node.js, Express, and MongoDB.

## Features

- HR Dashboard
- Employee Dashboard
- Team Management
- Task Management
- Attendance Tracking
- Leave Management
- Performance Evaluation
- Salary Management
- Ticket System

## Tech Stack

- Frontend: React.js, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB
- Authentication: JWT

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB (v4.4 or higher)

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd cursor-hrms
```

2. Install MongoDB:
```bash
# For Ubuntu/Debian
sudo apt update
sudo apt install -y mongodb-org

# For macOS
brew install mongodb-community
```

3. Start MongoDB service:
```bash
# For Ubuntu/Debian
sudo systemctl start mongod

# For macOS
brew services start mongodb-community
```

4. Install dependencies:
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

5. Configure environment variables:
Create a `.env` file in the root directory. Below are the required environment variables with descriptions:

```env
# MongoDB connection string (required)
# Format: mongodb://[username:password@]host[:port]/database
MONGO_URI=mongodb://localhost:27017/hrms_db

# Secret key for JWT token generation (required)
# Use a strong, random string of at least 32 characters
JWT_SECRET=your_secure_jwt_secret_key_123

# Default HR admin credentials (required)
# These will be used to create the initial HR admin account
HR_EMAIL=hr@company.com
HR_PASSWORD=hr_password

# Server configuration (optional)
# Port number for the backend server (defaults to 5000 if not set)
PORT=5000

# Application environment (optional)
# Values: development, production, test (defaults to development)
NODE_ENV=development

# Email configuration for password reset (optional)
# Required only if you want to enable password reset functionality
EMAIL_SERVICE=gmail
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
```

Note: Never commit your `.env` file to version control. Add it to your `.gitignore` file.

6. Initialize the database:
```bash
npm run init-db
```

7. Start the development server:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Project Structure

```
cursor-hrms/
├── client/                 # React frontend
│   ├── public/            # Static files
│   └── src/               # React source code
│       ├── components/    # Reusable components
│       ├── pages/         # Page components
│       ├── redux/         # Redux store and slices
│       └── App.js         # Main App component
├── server/                # Node.js backend
│   ├── config/           # Configuration files
│   ├── middleware/       # Custom middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   └── server.js         # Server entry point
└── package.json          # Project dependencies
```

## Available Scripts

- `npm start`: Start the production server
- `npm run server`: Start the development server
- `npm run client`: Start the React development server
- `npm run dev`: Start both servers concurrently
- `npm run init-db`: Initialize the database with sample data

## License

ISC 
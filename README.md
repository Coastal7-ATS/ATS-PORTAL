# Recruitment Portal

A comprehensive web-based recruitment management system for Coastal Seven Technologies, built with FastAPI backend and React frontend.

## Features

### Admin Portal
- **CSV Upload**: Upload job data via CSV files with preview and validation
- **Job Management**: View, filter, and manage all job openings
- **HR User Management**: Manage HR personnel accounts
- **Dashboard**: Analytics and statistics with charts
- **Candidate Overview**: View all candidates across all jobs

### HR Portal
- **Assigned Jobs**: View and manage jobs allocated to HR personnel
- **Candidate Management**: Update candidate statuses and add notes
- **Dashboard**: Personal statistics and job overview
- **Status Tracking**: Track candidate application progress

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **MongoDB Atlas**: Cloud database for data storage
- **JWT Authentication**: Secure token-based authentication
- **Pandas**: CSV processing and data manipulation
- **Motor**: Async MongoDB driver

### Frontend
- **React 18**: Modern JavaScript framework
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Chart.js**: Data visualization
- **Framer Motion**: Smooth animations
- **React Dropzone**: File upload functionality
- **React Toastify**: Notifications

## Project Structure

```
P4-V2/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── database.py          # MongoDB connection
│   ├── auth.py              # Authentication logic
│   ├── models.py            # Pydantic models
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── main.jsx         # App entry point
│   ├── package.json         # Node dependencies
│   └── vite.config.js       # Vite configuration
└── README.md
```

## Installation & Setup

### Option 1: Docker (Recommended)

#### Prerequisites
- Docker Desktop installed on your system
- Docker Compose (usually comes with Docker Desktop)

#### Quick Start with Docker

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd P4-V2
   ```

2. **Start the application**:
   ```bash
   # For development (with hot reload)
   docker-compose -f docker-compose.dev.yml up --build
   
   # For production
   docker-compose -f docker-compose.prod.yml up --build -d
   
   # Or use the provided scripts
   ./docker-start.sh dev    # Linux/Mac
   docker-start.bat dev     # Windows
   ```

3. **Access the application**:
   - Frontend: http://localhost (or http://localhost:3000 for dev)
   - Backend API: http://13.200.243.193:8000
   - MongoDB: MongoDB Atlas (Cloud)

#### Docker Commands

```bash
# Start services
docker-compose up --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Clean up everything
docker-compose down -v
docker system prune -a
```

For detailed Docker instructions, see [DOCKER_README.md](./DOCKER_README.md).

### Option 2: Manual Setup

#### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB Atlas account

#### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Create a `.env` file in the backend directory:
   ```
   MONGODB_URL=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/recruitment_portal?retryWrites=true&w=majority
   JWT_SECRET_KEY=your_super_secret_jwt_key_here_make_it_long_and_random
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

5. **Run the backend server:**
   ```bash
   python main.py
   ```
       The API will be available at `http://13.200.243.193:8000`

#### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info

### Admin Endpoints
- `POST /admin/upload-csv` - Upload CSV file
- `GET /admin/jobs` - Get all jobs
- `PUT /admin/jobs/{id}/allocate` - Allocate job to HR
- `GET /admin/users` - Get all HR users
- `GET /admin/dashboard` - Get admin dashboard stats
- `GET /admin/candidates` - Get all candidates

### HR Endpoints
- `GET /hr/jobs` - Get assigned jobs
- `PUT /hr/jobs/{id}/status` - Update job status
- `GET /hr/candidates/{job_id}` - Get candidates for job
- `PUT /hr/candidates/{id}/status` - Update candidate status
- `GET /hr/dashboard` - Get HR dashboard stats

### Shared Endpoints
- `GET /jobs/{id}` - Get job details
- `GET /candidates/{id}` - Get candidate details
- `POST /candidates` - Create candidate
- `PUT /candidates/{id}` - Update candidate
- `GET /application-history/{id}` - Get status history

## Database Schema

### Collections

**users**
- `_id`: ObjectId
- `name`: String
- `email`: String (unique)
- `role`: String ("admin" or "hr")
- `password`: String (hashed)
- `created_at`: DateTime

**jobs**
- `_id`: ObjectId
- `title`: String
- `description`: String
- `location`: String
- `salary_package`: String
- `source_company`: String
- `uploaded_by`: String (user ID)
- `allocated_to`: String (HR user ID)
- `status`: String ("open", "allocated", "closed")
- `created_at`: DateTime

**candidates**
- `_id`: ObjectId
- `name`: String
- `email`: String
- `phone`: String
- `location`: String
- `current_ctc`: String
- `expected_ctc`: String
- `job_id`: String
- `github_link`: String (optional)
- `linkedin_link`: String (optional)
- `status`: String ("selected", "rejected", "in_progress")
- `notes`: String (optional)
- `last_updated_by`: String (HR user ID)
- `created_at`: DateTime

**application_history**
- `_id`: ObjectId
- `candidate_id`: String
- `job_id`: String
- `old_status`: String
- `new_status`: String
- `updated_by`: String (HR user ID)
- `timestamp`: DateTime
- `comment`: String (optional)

## Usage

### Admin Workflow
1. Register as admin user
2. Upload CSV file with job data
3. View and manage all jobs
4. Allocate jobs to HR personnel
5. Monitor recruitment progress through dashboard

### HR Workflow
1. Register as HR user
2. View assigned jobs
3. Manage candidates for each job
4. Update candidate statuses
5. Track progress through personal dashboard

## CSV Format

The system expects CSV files with the following columns:
- `title`: Job title
- `description`: Job description
- `location`: Job location
- `salary_package`: Salary/package details
- `source_company`: Company name

Example CSV:
```csv
title,description,location,salary_package,source_company
Software Engineer,Develop web applications,Bangalore,8-12 LPA,Tech Corp
Data Scientist,Analyze data and build models,Mumbai,10-15 LPA,Data Inc
```

## Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization

## Performance Features

- Async database operations
- Efficient MongoDB queries
- Client-side caching
- Optimized React rendering
- Responsive design

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software for Coastal Seven Technologies.

## Support

For technical support or questions, please contact the development team. 
# Docker Setup for Recruitment Portal

This document provides instructions for running the Recruitment Portal application using Docker.

## Prerequisites

- Docker Desktop installed on your system
- Docker Compose (usually comes with Docker Desktop)

## Quick Start

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd P4-V2
   ```

2. **Build and start all services**:
   ```bash
   docker-compose up --build
   ```

3. **Access the application**:
   - Frontend: http://localhost
   - Backend API: http://51.21.168.125:8000
   - MongoDB: MongoDB Atlas (Cloud)

## Services Overview

### 1. MongoDB Database
- **Type**: MongoDB Atlas (Cloud)
- **Database**: ats_recruitment
- **Connection**: mongodb+srv://Bharathi123:Bharathi123@cluster0.q0k9nft.mongodb.net/ats_recruitment

### 2. Backend API (FastAPI)
- **Container**: `recruitment-backend`
- **Port**: 8000
- **Framework**: FastAPI with Python 3.11
- **Database**: MongoDB

### 3. Frontend (React)
- **Container**: `recruitment-frontend`
- **Port**: 80
- **Framework**: React with Vite
- **Web Server**: Nginx

## Environment Variables

The application uses the following environment variables (configured in docker-compose.yml):

### Backend Environment Variables
- `MONGODB_URL`: MongoDB connection string
- `JWT_SECRET_KEY`: Secret key for JWT tokens
- `JWT_ALGORITHM`: JWT algorithm (HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time

### MongoDB Environment Variables
- `MONGODB_URL`: MongoDB Atlas connection string

## Docker Commands

### Start Services
```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Rebuild and start
docker-compose up --build
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### View Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb

# Follow logs in real-time
docker-compose logs -f
```

### Access Containers
```bash
# Access backend container
docker exec -it recruitment-backend bash

# Access frontend container
docker exec -it recruitment-frontend sh
```

### Database Operations
```bash
# Note: Database operations should be performed directly on MongoDB Atlas
# The application connects to MongoDB Atlas cloud database
```

## Development Workflow

### 1. Development Mode
For development, you can mount the source code as volumes:

```bash
# The docker-compose.yml already includes volume mounts for development
docker-compose up --build
```

### 2. Production Mode
For production, remove the volume mounts from docker-compose.yml and use:

```bash
docker-compose -f docker-compose.prod.yml up --build
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: If ports 80, 8000, or 27017 are already in use:
   ```bash
   # Check what's using the ports
   netstat -tulpn | grep :80
   netstat -tulpn | grep :8000
   netstat -tulpn | grep :27017
   ```

2. **Container won't start**: Check logs:
   ```bash
   docker-compose logs <service-name>
   ```

3. **Database connection issues**: Ensure MongoDB Atlas is accessible:
   ```bash
   docker-compose logs backend
   ```

4. **Frontend not loading**: Check if the build was successful:
   ```bash
   docker-compose logs frontend
   ```

### Reset Everything
```bash
# Stop and remove everything
docker-compose down -v
docker system prune -a
docker volume prune

# Rebuild from scratch
docker-compose up --build
```

## Security Considerations

1. **Change default passwords** in production:
   - Update MongoDB credentials
   - Change JWT secret key
   - Use environment files for sensitive data

2. **Use environment files**:
   ```bash
   # Create .env file
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Network security**:
   - The application uses a custom Docker network
   - Services communicate internally
   - Only necessary ports are exposed

## Performance Optimization

1. **Use multi-stage builds** (already implemented)
2. **Optimize Docker layers** (already implemented)
3. **Use production-ready images** (already implemented)

## Monitoring

### Health Checks
```bash
# Check if all services are running
docker-compose ps

# Check resource usage
docker stats
```

### Logs
```bash
# View real-time logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
```

## Backup and Restore

### Database Backup
```bash
# Note: Database backup and restore should be performed directly on MongoDB Atlas
# The application uses MongoDB Atlas cloud database
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Docker Image](https://hub.docker.com/_/mongo)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://reactjs.org/) 
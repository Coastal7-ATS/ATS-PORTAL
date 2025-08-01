@echo off
REM Docker Start Script for Recruitment Portal (Windows)
REM Usage: docker-start.bat [dev|prod]

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=dev

echo Starting Recruitment Portal in %ENVIRONMENT% mode...

if "%ENVIRONMENT%"=="dev" (
    echo Starting development environment...
    docker-compose -f docker-compose.dev.yml up --build
) else if "%ENVIRONMENT%"=="prod" (
    echo Starting production environment...
    docker-compose -f docker-compose.prod.yml up --build -d
) else (
    echo Starting default environment...
    docker-compose up --build
)

echo.
echo Recruitment Portal is starting up!
echo Access the application at:
echo - Frontend: http://localhost
echo - Backend API: http://13.200.243.193:8000
echo - MongoDB: localhost:27017
pause 
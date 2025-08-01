@echo off
REM Docker Stop Script for Recruitment Portal (Windows)
REM Usage: docker-stop.bat [dev|prod]

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=dev

echo Stopping Recruitment Portal in %ENVIRONMENT% mode...

if "%ENVIRONMENT%"=="dev" (
    echo Stopping development environment...
    docker-compose -f docker-compose.dev.yml down
) else if "%ENVIRONMENT%"=="prod" (
    echo Stopping production environment...
    docker-compose -f docker-compose.prod.yml down
) else (
    echo Stopping default environment...
    docker-compose down
)

echo Recruitment Portal has been stopped!
pause 
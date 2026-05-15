@echo off
REM Simple script to download dependencies and run the SRD Desktop Application

echo Installing Maven dependencies...
call mvnw.cmd clean install

if %ERRORLEVEL% neq 0 (
    echo Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Starting SRD Desktop Application...
call mvnw.cmd javafx:run

pause

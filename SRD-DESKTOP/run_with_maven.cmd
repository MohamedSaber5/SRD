@echo off
REM Set Maven Home to the downloaded location
set MAVEN_HOME=C:\Users\ModernComputer\Downloads\apache-maven-3.9.6-bin.zip\apache-maven-3.9.6
set PATH=%MAVEN_HOME%\bin;%PATH%

REM Change to project directory
cd /d C:\Users\ModernComputer\Desktop\SRD\SRD-DESKTOP

echo.
echo ============================================
echo تحميل المتطلبات...
echo Downloading Dependencies...
echo ============================================
echo.

REM Download dependencies
call mvn clean install

if %ERRORLEVEL% neq 0 (
    echo.
    echo خطأ: فشل تحميل المتطلبات
    echo ERROR: Failed to download dependencies
    pause
    exit /b 1
)

echo.
echo ============================================
echo تشغيل التطبيق...
echo Running Application...
echo ============================================
echo.

REM Run the application
call mvn javafx:run

pause

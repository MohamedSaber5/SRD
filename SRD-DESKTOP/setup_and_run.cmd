@echo off
REM Extract Maven and run the project

set ZIP_FILE=C:\Users\ModernComputer\Downloads\apache-maven-3.9.6-bin.zip
set EXTRACT_PATH=C:\Users\ModernComputer\Downloads
set MAVEN_HOME=C:\Users\ModernComputer\Downloads\apache-maven-3.9.6

echo.
echo ============================================
echo فك ضغط Maven...
echo Extracting Maven...
echo ============================================
echo.

REM Check if already extracted
if exist "%MAVEN_HOME%" (
    echo Maven موجود بالفعل ✓
    goto SKIP_EXTRACT
)

REM Extract using PowerShell
powershell -Command "Expand-Archive -Path '%ZIP_FILE%' -DestinationPath '%EXTRACT_PATH%' -Force"

if %ERRORLEVEL% neq 0 (
    echo.
    echo خطأ في فك الضغط
    echo ERROR: Failed to extract Maven
    pause
    exit /b 1
)

:SKIP_EXTRACT

echo.
echo فحص Maven...
if exist "%MAVEN_HOME%\bin\mvn.cmd" (
    echo Maven موجود ✓
) else (
    echo Maven غير موجود ✗
    pause
    exit /b 1
)

echo.
echo ============================================
echo تحميل المتطلبات...
echo Downloading Dependencies...
echo ============================================
echo.

cd /d C:\Users\ModernComputer\Desktop\SRD\SRD-DESKTOP

REM Set Maven Home
set PATH=%MAVEN_HOME%\bin;%PATH%

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

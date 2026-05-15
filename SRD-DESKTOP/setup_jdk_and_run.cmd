@echo off
REM Script to download JDK 17 and setup the project

setlocal enabledelayedexpansion

set JDK_INSTALL_PATH=C:\Program Files\Java\jdk-17
set MAVEN_PATH=C:\Users\ModernComputer\Downloads\apache-maven-3.9.6
set PROJECT_PATH=C:\Users\ModernComputer\Desktop\SRD\SRD-DESKTOP

echo.
echo ============================================
echo تحميل JDK 17 و اعداد البيئة
echo Setting up JDK 17 and Environment
echo ============================================
echo.

REM Check if JDK 17 is already installed
if exist "%JDK_INSTALL_PATH%" (
    echo JDK 17 موجود بالفعل ✓
    goto SET_JAVA_HOME
)

echo سيتم تحميل JDK 17 من Oracle...
echo Downloading JDK 17 from Eclipse Temurin (OpenJDK)...
echo.

REM Create Java directory if not exists
if not exist "C:\Program Files\Java" mkdir "C:\Program Files\Java"

REM Download JDK 17 using PowerShell
echo Downloading... هذا قد يستغرق وقتاً
powershell -Command "^
    $url = 'https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.10+7/OpenJDK17U-jdk_x64_windows_hotspot_17.0.10_7.zip'; ^
    $output = 'C:\OpenJDK17.zip'; ^
    Write-Host 'جاري التحميل...' ; ^
    (New-Object System.Net.ServicePointManager).SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; ^
    (New-Object System.Net.WebClient).DownloadFile($url, $output); ^
    Write-Host 'تم التحميل، جاري فك الضغط...'; ^
    Expand-Archive -Path $output -DestinationPath 'C:\Program Files\Java' -Force; ^
    Rename-Item -Path 'C:\Program Files\Java\jdk-17.0.10+7' -NewName 'jdk-17' -Force; ^
    Remove-Item -Path $output -Force; ^
    Write-Host 'تم اكمال التثبيت ✓'
"

if %ERRORLEVEL% neq 0 (
    echo.
    echo خطأ في التحميل. حاول يدوياً:
    echo https://adoptium.net/temurin/releases/?version=17
    pause
    exit /b 1
)

:SET_JAVA_HOME

echo.
echo ============================================
echo اعداد متغيرات البيئة
echo Setting up Environment Variables
echo ============================================
echo.

REM Set JAVA_HOME
setx JAVA_HOME "%JDK_INSTALL_PATH%"
set JAVA_HOME=%JDK_INSTALL_PATH%
set PATH=%JAVA_HOME%\bin;%MAVEN_PATH%\bin;%PATH%

echo JAVA_HOME = %JAVA_HOME%
echo.

REM Verify Java
echo فحص Java...
java -version
echo.

REM Verify Maven
echo فحص Maven...
%MAVEN_PATH%\bin\mvn --version
echo.

echo ============================================
echo تحميل المتطلبات
echo Downloading Dependencies
echo ============================================
echo.

cd /d %PROJECT_PATH%

REM Clean and install
call %MAVEN_PATH%\bin\mvn clean install

if %ERRORLEVEL% neq 0 (
    echo.
    echo خطأ في التحميل
    pause
    exit /b 1
)

echo.
echo ============================================
echo تشغيل التطبيق
echo Running Application
echo ============================================
echo.

call %MAVEN_PATH%\bin\mvn javafx:run

pause

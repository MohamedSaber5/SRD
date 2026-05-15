@echo off
REM Simple script to setup and run the project

setlocal enabledelayedexpansion

set JDK_INSTALL_PATH=C:\Program Files\Java\jdk-17
set MAVEN_PATH=C:\Users\ModernComputer\Downloads\apache-maven-3.9.6
set PROJECT_PATH=C:\Users\ModernComputer\Desktop\SRD\SRD-DESKTOP

echo.
echo ============================================
echo اعداد البيئة و تشغيل التطبيق
echo Setting up and Running Application
echo ============================================
echo.

REM Check if JDK 17 exists
if not exist "%JDK_INSTALL_PATH%" (
    echo.
    echo تنبيه: JDK 17 غير موجود
    echo WARNING: JDK 17 not found
    echo.
    echo يرجى تحميله من هنا:
    echo Please download from: https://adoptium.net/temurin/releases/?version=17
    echo.
    echo اختر: Windows x64 JDK
    echo Select: Windows x64 JDK
    echo.
    echo ثم استخرج الملف في: C:\Program Files\Java\jdk-17
    echo Extract to: C:\Program Files\Java\jdk-17
    echo.
    pause
    exit /b 1
)

echo JDK 17 موجود ✓

REM Set JAVA_HOME
set JAVA_HOME=%JDK_INSTALL_PATH%
set PATH=%JAVA_HOME%\bin;%MAVEN_PATH%\bin;%PATH%

echo.
echo فحص Java...
java -version
echo.

echo فحص Maven...
"%MAVEN_PATH%\bin\mvn.cmd" --version
echo.

echo ============================================
echo تحميل المتطلبات (هذا قد يستغرق وقتاً)
echo Downloading Dependencies (This may take time)
echo ============================================
echo.

cd /d "%PROJECT_PATH%"

"%MAVEN_PATH%\bin\mvn.cmd" clean install -DskipTests

if %ERRORLEVEL% neq 0 (
    echo.
    echo خطأ: فشل تحميل المتطلبات
    echo ERROR: Failed to download dependencies
    echo.
    echo تحقق من الاتصال بالإنترنت
    echo Check your internet connection
    pause
    exit /b 1
)

echo.
echo ============================================
echo تشغيل التطبيق
echo Running Application
echo ============================================
echo.

"%MAVEN_PATH%\bin\mvn.cmd" javafx:run

pause

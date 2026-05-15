@echo off
REM Diagnostic script to identify the issue

set MAVEN_HOME=C:\Users\ModernComputer\Downloads\apache-maven-3.9.6-bin.zip\apache-maven-3.9.6

echo.
echo ============================================
echo فحص النظام - System Diagnostics
echo ============================================
echo.

echo [1] فحص Java...
java -version
echo.

echo [2] فحص Maven...
%MAVEN_HOME%\bin\mvn --version
echo.

echo [3] الذهاب للمجلد...
cd /d C:\Users\ModernComputer\Desktop\SRD\SRD-DESKTOP
echo Current Directory: %cd%
echo.

echo [4] فحص pom.xml...
if exist pom.xml (
    echo pom.xml موجود ✓
) else (
    echo pom.xml غير موجود ✗
)
echo.

echo [5] محاولة تحميل المتطلبات مع تفاصيل...
%MAVEN_HOME%\bin\mvn -X clean install

pause

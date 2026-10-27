@echo off
setlocal

set "CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if not exist "%CSC%" set "CSC=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
if not exist "%CSC%" (
  echo Could not find the Windows .NET Framework C# compiler.
  exit /b 1
)

"%CSC%" /nologo /target:winexe /out:"%~dp0SlopeRush.exe" ^
  "%~dp0SlopeRushLauncher.cs"
if errorlevel 1 exit /b %errorlevel%

echo Created "%~dp0SlopeRush.exe"

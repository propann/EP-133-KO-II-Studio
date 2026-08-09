@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
  py -3 tools\serve_local.py --open
  goto :end
)

where python >nul 2>nul
if %errorlevel%==0 (
  python tools\serve_local.py --open
  goto :end
)

echo Python 3 est necessaire pour ce lancement local.
echo Installe-le depuis https://www.python.org/downloads/ puis relance ce fichier.
pause

:end
endlocal

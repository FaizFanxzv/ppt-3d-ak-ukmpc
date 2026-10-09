@echo off
setlocal EnableExtensions
title Presentasi 3D - Divisi AK UKMPC UNESA
rem Selalu bekerja dari folder tempat file ini berada (tidak memakai path absolut)
cd /d "%~dp0"

echo.
echo  ================================================
echo   Presentasi 3D - Divisi AK UKMPC UNESA 2026
echo  ================================================
echo.

if not exist "index.html" goto :missing
if not exist "tools\serve.py" goto :missing

rem --- Cari Python 3: py launcher, lalu python, lalu python3 ---
set "PY="
py -3 -c "import sys" >nul 2>nul
if not errorlevel 1 set "PY=py -3"
if defined PY goto :found
python -c "import sys; sys.exit(0 if sys.version_info >= (3, 7) else 1)" >nul 2>nul
if not errorlevel 1 set "PY=python"
if defined PY goto :found
python3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 7) else 1)" >nul 2>nul
if not errorlevel 1 set "PY=python3"
if defined PY goto :found
goto :nopython

:found
echo  Memakai: %PY%
echo  Membuka browser... (jika tidak terbuka, salin alamat di bawah ke browser)
echo.
%PY% "tools\serve.py" %*
if errorlevel 1 goto :servererror
goto :end

:nopython
echo  [X] Python 3 tidak ditemukan di komputer ini.
echo.
echo      Presentasi membutuhkan server lokal sederhana agar model 3D bisa dimuat.
echo      Pilihan:
echo        1. Pasang Python 3 dari https://www.python.org/downloads/
echo           (centang "Add python.exe to PATH" saat instalasi),
echo           lalu klik ganda run.bat lagi.
echo        2. Atau gunakan cara alternatif di README.md
echo           (misalnya ekstensi "Live Server" di VS Code).
echo.
pause
exit /b 1

:missing
echo  [X] File proyek tidak lengkap - index.html atau tools\serve.py tidak ada.
echo      Pastikan ZIP sudah DIEKSTRAK seluruhnya (jangan dijalankan dari dalam ZIP),
echo      lalu jalankan run.bat dari folder hasil ekstrak.
echo.
pause
exit /b 1

:servererror
echo.
echo  [X] Server berhenti karena terjadi kesalahan (lihat pesan di atas).
echo.
pause
exit /b 1

:end
endlocal
exit /b 0

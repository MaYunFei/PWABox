@echo off
cd /d "%~dp0"
python serve.py
if errorlevel 1 (
    echo Python 未安装或未加入环境变量，请先安装 Python。
    pause
)

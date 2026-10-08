@echo off
start "tripvision-postgres" /MIN "C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D .devdata\pgdata -p 5544

<#
.SYNOPSIS
Starts the WealthWise stack: Ollama, Backend, ML-Backend, and Frontend.
Checks for existing processes on known ports before starting each service.
#>

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

$backendVenvPython = Join-Path $ProjectRoot 'Backend\venv\Scripts\python.exe'
$mlVenvUvicorn = Join-Path $ProjectRoot 'ML-Backend\.venv\Scripts\uvicorn.exe'

$services = @{
    'Ollama'       = @{ Port = 11434; Command = 'ollama'; Args = @('serve'); WorkingDir = $ProjectRoot; Env = @{} }
    'Backend'      = @{ Port = 8000;  Command = $backendVenvPython; Args = @('manage.py', 'runserver'); WorkingDir = Join-Path $ProjectRoot 'Backend'; Env = @{} }
    'ML-Backend'   = @{ Port = 8100;  Command = $mlVenvUvicorn; Args = @('app.main:app', '--port', '8100'); WorkingDir = Join-Path $ProjectRoot 'ML-Backend'; Env = @{} }
    'Frontend'     = @{ Port = 3000;  Command = 'npm.cmd'; Args = @('run', 'dev'); WorkingDir = Join-Path $ProjectRoot 'Frontend'; Env = @{} }
}

function Test-PortInUse {
    param([int]$Port)
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect('127.0.0.1', $Port)
        $tcpClient.Close()
        return $true
    } catch {
        return $false
    }
}

function Wait-Port {
    param(
        [int]$Port,
        [int]$TimeoutSeconds = 60
    )
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
        if (Test-PortInUse -Port $Port) { return $true }
        Start-Sleep -Seconds 1
    }
    return $false
}

Write-Host "`n=== WealthWise Dev Stack ===`n" -ForegroundColor Cyan

foreach ($name in $services.Keys) {
    $port = $services[$name].Port
    if (Test-PortInUse -Port $port) {
        Write-Host "[SKIP] $name is already running on port $port" -ForegroundColor Yellow
    } else {
        Write-Host "[START] $name will start on port $port" -ForegroundColor Green
    }
}

if (-not (Test-PortInUse -Port 11434)) {
    Write-Host "`nStarting Ollama..." -ForegroundColor Cyan
    Start-Process -FilePath 'ollama' -ArgumentList 'serve' -WindowStyle Hidden -PassThru | Out-Null
    if (-not (Wait-Port -Port 11434 -TimeoutSeconds 30)) {
        Write-Host "Warning: Ollama did not become ready within 30s" -ForegroundColor Yellow
    } else {
        Write-Host "Ollama is ready." -ForegroundColor Green
    }
} else {
    Write-Host "`nOllama already running." -ForegroundColor Yellow
}

if (-not (Test-PortInUse -Port 8000)) {
    Write-Host "`nStarting Backend (Django)..." -ForegroundColor Cyan
    Start-Process -FilePath $backendVenvPython -ArgumentList 'manage.py','runserver' -WorkingDirectory (Join-Path $ProjectRoot 'Backend') -WindowStyle Hidden
    if (-not (Wait-Port -Port 8000 -TimeoutSeconds 30)) {
        Write-Host "Warning: Backend did not become ready within 30s" -ForegroundColor Yellow
    } else {
        Write-Host "Backend is ready." -ForegroundColor Green
    }
} else {
    Write-Host "`nBackend already running." -ForegroundColor Yellow
}

if (-not (Test-PortInUse -Port 8100)) {
    Write-Host "`nStarting ML-Backend (FastAPI)..." -ForegroundColor Cyan
    Start-Process -FilePath $mlVenvUvicorn -ArgumentList 'app.main:app','--port','8100' -WorkingDirectory (Join-Path $ProjectRoot 'ML-Backend') -WindowStyle Hidden
    if (-not (Wait-Port -Port 8100 -TimeoutSeconds 30)) {
        Write-Host "Warning: ML-Backend did not become ready within 30s" -ForegroundColor Yellow
    } else {
        Write-Host "ML-Backend is ready." -ForegroundColor Green
    }
} else {
    Write-Host "`nML-Backend already running." -ForegroundColor Yellow
}

if (-not (Test-PortInUse -Port 3000)) {
    Write-Host "`nStarting Frontend (Next.js)..." -ForegroundColor Cyan
    Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -WorkingDirectory (Join-Path $ProjectRoot 'Frontend') -WindowStyle Hidden
    if (-not (Wait-Port -Port 3000 -TimeoutSeconds 60)) {
        Write-Host "Warning: Frontend did not become ready within 60s" -ForegroundColor Yellow
    } else {
        Write-Host "Frontend is ready." -ForegroundColor Green
    }
} else {
    Write-Host "`nFrontend already running." -ForegroundColor Yellow
}

Write-Host "`n=== Stack Status ===" -ForegroundColor Cyan

$ollamaStatus = if (Test-PortInUse -Port 11434) { 'Running' } else { 'Not running' }
$backendStatus = if (Test-PortInUse -Port 8000) { 'Running' } else { 'Not running' }
$mlStatus = if (Test-PortInUse -Port 8100) { 'Running' } else { 'Not running' }
$frontendStatus = if (Test-PortInUse -Port 3000) { 'Running' } else { 'Not running' }

Write-Host "Ollama: $ollamaStatus" -ForegroundColor $(if ($ollamaStatus -eq 'Running') { 'Green' } else { 'Red' })
Write-Host "Backend (http://localhost:8000): $backendStatus" -ForegroundColor $(if ($backendStatus -eq 'Running') { 'Green' } else { 'Red' })
Write-Host "ML-Backend (http://localhost:8100): $mlStatus" -ForegroundColor $(if ($mlStatus -eq 'Running') { 'Green' } else { 'Red' })
Write-Host "Frontend (http://localhost:3000): $frontendStatus" -ForegroundColor $(if ($frontendStatus -eq 'Running') { 'Green' } else { 'Red' })

Write-Host "`nOpen http://localhost:3000 in your browser." -ForegroundColor Cyan

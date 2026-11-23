# Inicia o ambiente local do Linha Fina sem instalar servicos globais.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$javaHome = Get-ChildItem (Join-Path $root '.tools\jdk\jdk-*') -Directory | Select-Object -First 1
$maven = Get-ChildItem (Join-Path $root '.tools\maven\*\bin\mvn.cmd') -File | Select-Object -First 1
$pgBin = Join-Path $root '.tools\postgresql\pgsql\bin'
$pgData = Join-Path $root 'backend\data\postgresql'

if (-not $javaHome -or -not $maven -or -not (Test-Path $pgBin)) {
    throw 'Ferramentas locais nao encontradas. Consulte backend/README.md para configurar Java, Maven e PostgreSQL.'
}
if (-not (Test-Path (Join-Path $root 'backend\.env'))) {
    throw 'Arquivo backend/.env ausente. Copie backend/.env.example e configure a senha local.'
}

if (-not (Get-NetTCPConnection -State Listen -LocalPort 5432 -ErrorAction SilentlyContinue)) {
    & (Join-Path $pgBin 'pg_ctl.exe') -D $pgData -l (Join-Path $root 'backend\data\postgresql.log') -w start
    if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel iniciar o PostgreSQL.' }
}

$env:JAVA_HOME = $javaHome.FullName
if (-not (Get-NetTCPConnection -State Listen -LocalPort 8080 -ErrorAction SilentlyContinue)) {
    Start-Process -FilePath $maven.FullName -ArgumentList '-ntp','spring-boot:run' -WorkingDirectory (Join-Path $root 'backend')
}
if (-not (Get-NetTCPConnection -State Listen -LocalPort 5180 -ErrorAction SilentlyContinue)) {
    Start-Process -FilePath 'node.exe' -ArgumentList 'server.mjs' -WorkingDirectory (Join-Path $root 'front')
}

Write-Output 'Linha Fina: http://localhost:5180'
Write-Output 'API Java:  http://localhost:8080/api'
Write-Output 'As janelas do backend e do frontend permanecerao abertas para exibir os logs.'

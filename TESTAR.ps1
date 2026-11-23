# Executa os testes Java no banco linhafina_test, separado do desenvolvimento.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$javaHome = Get-ChildItem (Join-Path $root '.tools\jdk\jdk-*') -Directory | Select-Object -First 1
$maven = Get-ChildItem (Join-Path $root '.tools\maven\*\bin\mvn.cmd') -File | Select-Object -First 1
if (-not $javaHome -or -not $maven) { throw 'JDK/Maven locais nao encontrados.' }
if (-not (Get-NetTCPConnection -State Listen -LocalPort 5432 -ErrorAction SilentlyContinue)) {
    $pgBin = Join-Path $root '.tools\postgresql\pgsql\bin'
    & (Join-Path $pgBin 'pg_ctl.exe') -D (Join-Path $root 'backend\data\postgresql') -l (Join-Path $root 'backend\data\postgresql.log') -w start
}
$env:JAVA_HOME = $javaHome.FullName
& $maven.FullName -f (Join-Path $root 'backend\pom.xml') -B -ntp test
exit $LASTEXITCODE

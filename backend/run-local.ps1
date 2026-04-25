$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$repo = Join-Path $projectRoot '.m2\repository'
$maven = Join-Path $projectRoot '.tools\apache-maven-3.9.9\bin\mvn.cmd'

& $maven "-Dmaven.repo.local=$repo" spring-boot:run

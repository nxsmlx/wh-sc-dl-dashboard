# Turn the workbook watcher on for Windows in one step.
#
#   powershell -ExecutionPolicy Bypass -File deploy\enable-watcher-windows.ps1 `
#     -Token <INGEST_TOKEN> -BasicAuth "board:<password>"
#
# It writes a private credentials file outside OneDrive, registers a Scheduled
# Task that starts the watcher hidden at logon (and restarts it if it stops),
# and starts it now. Safe to re-run.
param(
  [Parameter(Mandatory = $true)][string]$Token,
  [string]$BasicAuth = '',
  [string]$IngestUrl = 'https://wh.systemsphq.com/outbound-board/api/dashboard',
  [string]$Workbook = "$env:USERPROFILE\OneDrive - Hong Leong Yamaha Motor Sdn Bhd\SP - Documents\WH_OUTBOUND\Dashboard for SC and Delivery Data.xlsx",
  [int]$IntervalSeconds = 30
)
$ErrorActionPreference = 'Stop'
$TaskName = 'WH Wallboard Workbook Watcher'
$ProjectDir = Split-Path -Parent $PSScriptRoot
# Logs and state stay outside OneDrive so two machines never share them.
$ConfDir = Join-Path $env:USERPROFILE '.config\wh-wallboard'
$EnvFile = Join-Path $ConfDir 'ingest.env'

foreach ($value in @($Token, $BasicAuth, $IngestUrl, $Workbook)) {
  if ($value.Contains("'") -or $value.Contains("`n")) { throw 'Values may not contain single quotes or newlines.' }
}
if (-not (Test-Path -LiteralPath $Workbook)) { throw "Workbook not found: $Workbook" }
$Node = (Get-Command node -ErrorAction Stop).Source

Write-Host '== 1. Check the token is accepted =='
$headers = @{ 'x-ingest-token' = $Token }
if ($BasicAuth) {
  $headers['Authorization'] = 'Basic ' + [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($BasicAuth))
}
$probe = '{"lastUpdatedAt":"2000-01-01T00:00:00.000Z","selectedMonth":"2000-01-01","shipping":{},"delivery":{}}'
try {
  Invoke-WebRequest -Uri $IngestUrl -Method Post -Headers $headers -ContentType 'application/json' -Body $probe -UseBasicParsing | Out-Null
  $status = 200
} catch {
  $status = [int]$_.Exception.Response.StatusCode
}
switch ($status) {
  { $_ -in 200, 409 } { Write-Host 'Token accepted.' }
  401 { throw 'Rejected (401): check the Basic Auth password and INGEST_TOKEN.' }
  default { throw "Unexpected answer ($status) from $IngestUrl" }
}

Write-Host '== 2. Write the credentials file =='
New-Item -ItemType Directory -Force -Path $ConfDir | Out-Null
# Single quotes: node --env-file keeps backslashes in the Windows path literal.
@"
WORKBOOK='$Workbook'
INTERVAL_SECONDS=$IntervalSeconds
INGEST_URL='$IngestUrl'
INGEST_TOKEN='$Token'
INGEST_BASIC_AUTH='$BasicAuth'
LOG_FILE='$ConfDir\workbook-watch.log'
STATE_FILE='$ConfDir\watch-state.json'
"@ | Set-Content -LiteralPath $EnvFile -Encoding utf8NoBOM
icacls $EnvFile /inheritance:r /grant:r "$($env:USERNAME):(R,W)" | Out-Null
Write-Host "$EnvFile written (readable by $env:USERNAME only)."

Write-Host '== 3. Register the Scheduled Task =='
# conhost --headless keeps node running without a console window.
$action = New-ScheduledTaskAction -Execute 'conhost.exe' `
  -Argument "--headless `"$Node`" --env-file=`"$EnvFile`" scripts\watch-workbook.mjs" `
  -WorkingDirectory $ProjectDir
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
  -MultipleInstances IgnoreNew -StartWhenAvailable
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
  -Description 'Imports the SC/Delivery workbook when it changes and uploads it to the outbound board.' `
  -Force | Out-Null
Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
Start-ScheduledTask -TaskName $TaskName
Start-Sleep -Seconds 8

Write-Host '== 4. Result =='
(Get-ScheduledTask -TaskName $TaskName).State
Get-Content -LiteralPath "$ConfDir\workbook-watch.log" -Tail 5 -ErrorAction SilentlyContinue
Write-Host "Watcher is on. Log: $ConfDir\workbook-watch.log"

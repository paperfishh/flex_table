[CmdletBinding()]
param(
    [string]$PluginName = 'FlexTable'
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSCommandPath
$pluginDirectory = Join-Path $root $PluginName
$distDirectory = Join-Path $root 'dist'
$archiveZip = Join-Path $distDirectory "$PluginName.zip"
$archiveViz = Join-Path $distDirectory "$PluginName.viz"

if (-not (Test-Path -LiteralPath $pluginDirectory -PathType Container)) {
    throw "Plug-in directory was not found: $pluginDirectory"
}

New-Item -ItemType Directory -Force -Path $distDirectory | Out-Null
if (Test-Path -LiteralPath $archiveZip) { Remove-Item -LiteralPath $archiveZip -Force }
if (Test-Path -LiteralPath $archiveViz) { Remove-Item -LiteralPath $archiveViz -Force }

Compress-Archive -Path $pluginDirectory -DestinationPath $archiveZip -CompressionLevel Optimal
Copy-Item -Path $archiveZip -Destination $archiveViz -Force

Write-Host "Build Successful!" -ForegroundColor Green
Write-Host "Created $archiveZip" -ForegroundColor Cyan
Write-Host "Created $archiveViz" -ForegroundColor Cyan

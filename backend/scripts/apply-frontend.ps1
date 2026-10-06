$ErrorActionPreference = 'Stop'
$backendRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$stagedRoot = (Resolve-Path -LiteralPath (Join-Path $backendRoot 'frontend-integration')).Path
$manifest = Get-Content -LiteralPath (Join-Path $stagedRoot 'manifest.json') -Raw | ConvertFrom-Json
$frontendRoot = (Resolve-Path -LiteralPath $manifest.target).Path
$expectedFrontendRoot = [System.IO.Directory]::GetParent($backendRoot).FullName
if ($frontendRoot -ne $expectedFrontendRoot) { throw 'Unexpected frontend target' }
$backupRoot = Join-Path $backendRoot ('frontend-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))

# Validate every target and hash before performing any copy.
foreach ($entry in $manifest.files) {
  $targetPath = [System.IO.Path]::GetFullPath((Join-Path $frontendRoot $entry.path))
  $sourcePath = [System.IO.Path]::GetFullPath((Join-Path $stagedRoot $entry.path))
  if (!$targetPath.StartsWith($frontendRoot + [System.IO.Path]::DirectorySeparatorChar)) { throw 'Target escapes frontend root' }
  if (!$sourcePath.StartsWith($stagedRoot + [System.IO.Path]::DirectorySeparatorChar)) { throw 'Source escapes staging root' }
  if ((Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.stagedHash) { throw "Staged file changed: $($entry.path)" }
  if ($entry.originalHash) {
    if (!(Test-Path -LiteralPath $targetPath)) { throw "Original file is missing: $($entry.path)" }
    if ((Get-FileHash -LiteralPath $targetPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.originalHash) { throw "Frontend file changed since review: $($entry.path)" }
  } elseif (Test-Path -LiteralPath $targetPath) { throw "A new target now exists: $($entry.path)" }
}
foreach ($entry in $manifest.files) {
  $targetPath = Join-Path $frontendRoot $entry.path
  $sourcePath = Join-Path $stagedRoot $entry.path
  if (Test-Path -LiteralPath $targetPath) {
    $backupPath = Join-Path $backupRoot $entry.path
    New-Item -ItemType Directory -Path ([System.IO.Path]::GetDirectoryName($backupPath)) -Force | Out-Null
    Copy-Item -LiteralPath $targetPath -Destination $backupPath
  }
  New-Item -ItemType Directory -Path ([System.IO.Path]::GetDirectoryName($targetPath)) -Force | Out-Null
  Copy-Item -LiteralPath $sourcePath -Destination $targetPath -Force
}
Write-Output "Applied $($manifest.files.Count) frontend files. Originals backed up to $backupRoot"

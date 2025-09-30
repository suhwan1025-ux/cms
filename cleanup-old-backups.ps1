# Cleanup old backups script (older than 30 minutes)

Write-Host "=== Cleanup Old Backups Start ===" -ForegroundColor Green

$cutoffDate = (Get-Date).AddMinutes(-30)
Write-Host "Cutoff time: $($cutoffDate.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Cyan

$backupFolders = Get-ChildItem -Path "." -Directory | Where-Object { $_.Name -like "backup_auto_*" }

Write-Host "Total backup folders: $($backupFolders.Count)" -ForegroundColor Yellow

$deletedCount = 0
$keptCount = 0

foreach ($folder in $backupFolders) {
    if ($folder.CreationTime -lt $cutoffDate) {
        try {
            Remove-Item -Path $folder.FullName -Recurse -Force
            Write-Host "Deleted: $($folder.Name) (Created: $($folder.CreationTime.ToString('yyyy-MM-dd HH:mm:ss')))" -ForegroundColor Red
            $deletedCount++
        } catch {
            Write-Host "Delete failed: $($folder.Name) - $($_.Exception.Message)" -ForegroundColor DarkRed
        }
    } else {
        Write-Host "Kept: $($folder.Name) (Created: $($folder.CreationTime.ToString('yyyy-MM-dd HH:mm:ss')))" -ForegroundColor Green
        $keptCount++
    }
}

Write-Host "`n=== Cleanup Results ===" -ForegroundColor Magenta
Write-Host "Deleted backups: $deletedCount" -ForegroundColor Red
Write-Host "Kept backups: $keptCount" -ForegroundColor Green
$totalCount = $deletedCount + $keptCount
Write-Host "Total backups: $totalCount" -ForegroundColor Cyan 
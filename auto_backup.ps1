# Auto Backup Script
# Backup the entire project at specified intervals and keep only the latest 30 backups

param(
    [int]$IntervalMinutes = 5
)

Write-Host "Auto backup started. Running backup every $IntervalMinutes minutes." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow

# Backup function
function Backup-Project {
    $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $backupFolder = "backup_auto_$timestamp"
    
    Write-Host "Backup started: $backupFolder" -ForegroundColor Cyan
    
    try {
        # 백업 폴더 생성
        New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null
        
        # Copy src folder
        if (Test-Path "src") {
            Copy-Item -Path "src" -Destination $backupFolder -Recurse -Force
            Write-Host "  ✓ src folder backup completed" -ForegroundColor Green
        }
        
        # Copy public folder
        if (Test-Path "public") {
            Copy-Item -Path "public" -Destination $backupFolder -Recurse -Force
            Write-Host "  ✓ public folder backup completed" -ForegroundColor Green
        }
        
        # Copy package.json
        if (Test-Path "package.json") {
            Copy-Item -Path "package.json" -Destination $backupFolder -Force
            Write-Host "  ✓ package.json backup completed" -ForegroundColor Green
        }
        
        # Copy README.md
        if (Test-Path "README.md") {
            Copy-Item -Path "README.md" -Destination $backupFolder -Force
            Write-Host "  ✓ README.md backup completed" -ForegroundColor Green
        }
        
        Write-Host "Backup completed: $backupFolder" -ForegroundColor Green
        
        # Clean up old backups (keep only latest 30)
        Cleanup-OldBackups
        
    } catch {
        Write-Host "Backup error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Clean up old backups function (keep only the latest 30 backups)
function Cleanup-OldBackups {
    $backupFolders = Get-ChildItem -Path "." -Directory | Where-Object { $_.Name -like "backup_auto_*" } | Sort-Object CreationTime -Descending
    
    $deletedCount = 0
    $keepCount = 30
    
    # 최근 30개를 제외한 나머지 백업 삭제
    if ($backupFolders.Count -gt $keepCount) {
        $foldersToDelete = $backupFolders | Select-Object -Skip $keepCount
        
        foreach ($folder in $foldersToDelete) {
            try {
                Remove-Item -Path $folder.FullName -Recurse -Force
                Write-Host "Deleted old backup: $($folder.Name) (Created: $($folder.CreationTime.ToString('yyyy-MM-dd HH:mm:ss')))" -ForegroundColor Yellow
                $deletedCount++
            } catch {
                Write-Host "Failed to delete backup: $($folder.Name)" -ForegroundColor Red
            }
        }
    }
    
    if ($deletedCount -gt 0) {
        Write-Host "Total $deletedCount old backups deleted. Keeping latest $keepCount backups." -ForegroundColor Green
    } else {
        Write-Host "No old backups to delete. Current backup count: $($backupFolders.Count)" -ForegroundColor Cyan
    }
}

# Main loop
while ($true) {
    $currentTime = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    Write-Host "`n[$currentTime] Running backup..." -ForegroundColor Magenta
    
    Backup-Project
    
    $nextBackup = (Get-Date).AddMinutes($IntervalMinutes)
    Write-Host "Next backup scheduled: $($nextBackup.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Cyan
    
    # Wait
    Start-Sleep -Seconds ($IntervalMinutes * 60)
} 
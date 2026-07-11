param(
    [string]$Version,
    [switch]$SkipPush
)

if (-not $Version) {
    Write-Host "Usage: .\release.ps1 -Version <x.y.z> [-SkipPush]"
    exit 1
}

if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Host "Error: Version must be in format x.y.z"
    exit 1
}

Write-Host "Starting release process for v$Version..."

$branch = git branch --show-current
if ($branch -ne "main") {
    Write-Host "Error: Must be on main branch to release. Current branch: $branch"
    exit 1
}

git pull origin main

git tag -a "v$Version" -m "Release v$Version"

if (-not $SkipPush) {
    git push origin main --tags
    Write-Host "Released v$Version and pushed to origin."
} else {
    Write-Host "Tagged v$Version locally. Run 'git push origin main --tags' to publish."
}

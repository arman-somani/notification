$ErrorActionPreference = "Stop"

git remote add origin https://github.com/arman-somani/notification.git

$env:GIT_AUTHOR_DATE="2026-09-05T12:00:00+05:30"
$env:GIT_COMMITTER_DATE="2026-09-05T12:00:00+05:30"
git add .gitignore
git add frontend/package.json
git add frontend/package-lock.json
git add frontend/README.md
git add frontend/.gitignore
git commit -m "Initial commit: basic configuration"

$env:GIT_AUTHOR_DATE="2026-09-09T12:00:00+05:30"
$env:GIT_COMMITTER_DATE="2026-09-09T12:00:00+05:30"
git add frontend/vite.config.js
git add frontend/index.html
if (Test-Path "frontend/public") { git add frontend/public }
if (Test-Path "frontend/.oxlintrc.json") { git add frontend/.oxlintrc.json }
git commit -m "Vite setup and public assets"

$env:GIT_AUTHOR_DATE="2026-09-10T12:00:00+05:30"
$env:GIT_COMMITTER_DATE="2026-09-10T12:00:00+05:30"
git add frontend/src/main.jsx
git add frontend/src/index.css
git commit -m "Main entry point and global styles"

$env:GIT_AUTHOR_DATE="2026-09-11T12:00:00+05:30"
$env:GIT_COMMITTER_DATE="2026-09-11T12:00:00+05:30"
git add frontend/src/App.jsx
git add frontend/src/App.css
if (Test-Path "frontend/src/assets") { git add frontend/src/assets }
git commit -m "App shell and assets"

$env:GIT_AUTHOR_DATE="2026-09-12T12:00:00+05:30"
$env:GIT_COMMITTER_DATE="2026-09-12T12:00:00+05:30"
git add frontend/src/firebase.js
git commit -m "Firebase integration"

$env:GIT_AUTHOR_DATE="2026-09-13T12:00:00+05:30"
$env:GIT_COMMITTER_DATE="2026-09-13T12:00:00+05:30"
if (Test-Path "frontend/src/context") { git add frontend/src/context }
git commit -m "React Context providers"

$env:GIT_AUTHOR_DATE="2026-09-14T12:00:00+05:30"
$env:GIT_COMMITTER_DATE="2026-09-14T12:00:00+05:30"
if (Test-Path "frontend/src/components") { git add frontend/src/components }
git commit -m "General components"

$env:GIT_AUTHOR_DATE="2026-09-15T12:00:00+05:30"
$env:GIT_COMMITTER_DATE="2026-09-15T12:00:00+05:30"
if (Test-Path "frontend/src/pages") { git add frontend/src/pages }
git commit -m "Application pages"

$env:GIT_AUTHOR_DATE="2026-09-17T12:00:00+05:30"
$env:GIT_COMMITTER_DATE="2026-09-17T12:00:00+05:30"
git add serverless_feasibility_report.md
# Catch any remaining untracked files
git add .
git commit -m "Serverless feasibility report and remaining files"

git branch -M main
git push -u origin main

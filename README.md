# Supabase Backup Tool

Complete backup solution for Supabase database and storage buckets. Creates a single zip file containing your entire project data for easy restoration.

## What It Does

- **Database**: Exports all inventory table data to JSON (pagination handles unlimited rows)
- **Storage**: Downloads all files from `inventory-images` and `inventory-videos` buckets
- **Packaging**: Creates single dated zip file (e.g., `backup-2025-07-31.zip`)
- **Reliability**: Retry logic handles network issues and rate limiting

## Setup

### Automated (GitHub Actions)

1. **Add GitHub Secrets:**

   - Go to repo **Settings** → **Secrets and variables** → **Actions**
   - Add `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
   - Secrets are encrypted and private (not visible in public repos)

2. **Workflow runs automatically:**
   - Daily at 6 AM UTC (1 AM EST / 2 AM EDT)
   - Manual trigger available in **Actions** tab

### Manual (Local)

1. **Install dependencies:** `npm install`
2. **Create `.env` file:**
   ```
   SUPABASE_URL=your_project_url
   SUPABASE_SERVICE_KEY=your_service_role_key
   ```
3. **Run backup:** `node backup.js`

## Output

Creates a complete backup zip file containing:

```
backup-2025-07-31/
├── inventory-backup.json    # Complete database export
├── inventory-images/        # All image files
└── inventory-videos/        # All video files (if any)
```

**Recovery**: Simply unzip the file to restore all data.

## Current Status

✅ **Automated Daily Backups**: GitHub Actions runs daily at 6 AM UTC  
✅ **30-Day Retention**: Backup artifacts stored for 30 days  
✅ **Manual Trigger**: Can run on-demand via Actions tab

## Next Steps Options

### Current (GitHub Artifacts)

- Backups stored as GitHub artifacts for 30 days
- Download manually from Actions tab when needed
- Free and reliable

### Google Drive Integration

- Add automatic upload to Google Drive after backup creation
- Unlimited retention (or your Drive storage limit)
- Requires Google Drive API setup

### Email Notifications

- Get notified when backups succeed/fail
- Simple status monitoring
- Easy to add to existing workflow

## File Structure

- `.github/workflows/backup.yml` - GitHub Actions automation
- `backup.js` - Main backup script
- `package.json` - Dependencies
- `.env` - Supabase credentials (not committed, local only)
- `backup-*/` - Local backup folders (ignored)
- `*.zip` - Compressed backup files (ignored)

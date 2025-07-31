# Supabase Backup Tool

Complete backup solution for Supabase database and storage buckets. Creates a single zip file containing your entire project data for easy restoration.

## What It Does

- **Database**: Exports all inventory table data to JSON (pagination handles unlimited rows)
- **Storage**: Downloads all files from `inventory-images` and `inventory-videos` buckets
- **Packaging**: Creates single dated zip file (e.g., `backup-2025-07-31.zip`)
- **Reliability**: Retry logic handles network issues and rate limiting

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create `.env` file:**

   ```
   SUPABASE_URL=your_project_url
   SUPABASE_SERVICE_KEY=your_service_role_key
   ```

3. **Run backup:**
   ```bash
   node backup.js
   ```

## Output

Creates a complete backup zip file containing:

```
backup-2025-07-31/
├── inventory-backup.json    # Complete database export
├── inventory-images/        # All image files
└── inventory-videos/        # All video files (if any)
```

**Recovery**: Simply unzip the file to restore all data.

## Next Steps Options

### Manual (Current)

- Run `node backup.js` daily
- Upload zip file to Google Drive manually
- Simple and reliable

### Automated Upload

- Add Google Drive API integration
- Automatic upload after backup creation
- Still requires manual script execution

### Full Automation

- Deploy to GitHub Actions
- Runs daily on schedule
- Automatic upload to Google Drive
- Zero manual intervention

### Hybrid Approach

- Keep manual script for immediate backups
- Add scheduled automation for daily backups
- Best of both worlds

## File Structure

- `backup.js` - Main backup script
- `package.json` - Dependencies
- `.env` - Supabase credentials (not committed)
- `backup-*/` - Local backup folders (ignored)
- `*.zip` - Compressed backup files (ignored)

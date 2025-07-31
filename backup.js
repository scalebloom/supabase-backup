// backup.js

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import archiver from "archiver";

dotenv.config();

console.log("Backup script starting...");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("✅ Supabase client created");

try {
  // Create backup folder with today's date
  const today = new Date().toISOString().split("T")[0];
  const backupFolder = `backup-${today}`;
  fs.mkdirSync(backupFolder, { recursive: true });

  // STEP 1: Export database
  console.log("📦 Starting inventory export...");

  let allItems = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .range(from, from + pageSize - 1);

    if (error) throw error;

    if (data.length === 0) break;

    allItems = [...allItems, ...data];
    console.log(`   📄 Loaded ${allItems.length} items so far...`);

    from += pageSize;
  }

  // Save database to backup folder
  const dbFilename = `${backupFolder}/inventory-backup.json`;
  fs.writeFileSync(dbFilename, JSON.stringify(allItems, null, 2));
  console.log(`✅ Database exported - ${allItems.length} items saved to ${dbFilename}`);

  // STEP 2: Export storage files
  console.log("📁 Starting storage backup...");

  const buckets = ["inventory-images", "inventory-videos"];

  for (const bucketName of buckets) {
    console.log(`   📁 Backing up ${bucketName}...`);

    // Get all files from bucket
    let allFiles = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const { data: files, error } = await supabase.storage.from(bucketName).list("", { limit, offset });

      if (error) {
        console.error(`❌ Error listing ${bucketName}:`, error.message);
        break;
      }

      if (files.length === 0) break;

      allFiles = [...allFiles, ...files];
      offset += limit;
    }

    if (allFiles.length === 0) {
      console.log(`   ✅ ${bucketName}: No files to backup`);
      continue;
    }

    // Create folder for this bucket
    const bucketFolder = `${backupFolder}/${bucketName}`;
    fs.mkdirSync(bucketFolder, { recursive: true });

    // Download all files with retry logic
    console.log(`   ⬇️  Downloading ${allFiles.length} files from ${bucketName}...`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i];
      let downloaded = false;

      // Try up to 3 times with delays
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const { data: fileData, error } = await supabase.storage.from(bucketName).download(file.name);

          if (error) {
            if (attempt === 3) {
              console.error(`     ❌ Failed to download ${file.name} after 3 attempts: ${error.message}`);
              failCount++;
            }
            continue;
          }

          const filePath = `${bucketFolder}/${file.name}`;
          const buffer = await fileData.arrayBuffer();
          fs.writeFileSync(filePath, Buffer.from(buffer));

          successCount++;
          downloaded = true;
          break; // Success, exit retry loop
        } catch (error) {
          if (attempt === 3) {
            console.error(`     ❌ Error downloading ${file.name} after 3 attempts: ${error.message}`);
            failCount++;
          }
          // Wait before retry (100ms, 200ms, then give up)
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 100));
          }
        }
      }

      // Progress update every 25 files
      if (i % 25 === 0 || i === allFiles.length - 1) {
        console.log(`     📄 ${i + 1}/${allFiles.length} processed (${successCount} ✅, ${failCount} ❌)`);
      }

      // Small delay between files to avoid rate limiting
      if (i % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    console.log(`   ✅ ${bucketName}: ${successCount}/${allFiles.length} files downloaded successfully`);
  }

  console.log(`✅ Storage backup complete - files saved to ${backupFolder}/`);

  // Wait a moment for file handles to close
  console.log("⏳ Waiting for file handles to close...");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // STEP 3: Create zip file using Node.js
  console.log("📦 Creating backup zip file...");
  const zipFile = `${backupFolder}.zip`;

  try {
    await createZipFile(backupFolder, zipFile);

    const stats = fs.statSync(zipFile);
    const sizeInMB = Math.round(stats.size / (1024 * 1024));

    console.log(`✅ Backup zip created: ${zipFile} (${sizeInMB}MB)`);
    console.log("📦 Ready for Google Drive upload!");
  } catch (error) {
    console.error("❌ Error creating zip:", error.message);
  }
} catch (error) {
  console.error("❌ Backup error:", error.message);
}

console.log("✅ Script runs successfully");

// Helper function to create zip file
function createZipFile(sourceFolder, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      resolve();
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(sourceFolder, false);
    archive.finalize();
  });
}

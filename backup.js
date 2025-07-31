import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

console.log("Backup script starting...");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("✅ Supabase client created");

// Export ALL inventory data using pagination
try {
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

    if (data.length === 0) break; // No more items

    allItems = [...allItems, ...data];
    console.log(`   📄 Loaded ${allItems.length} items so far...`);

    from += pageSize;
  }

  // Save to JSON file with today's date
  const today = new Date().toISOString().split("T")[0]; // 2025-01-30
  const filename = `inventory-backup-${today}.json`;

  fs.writeFileSync(filename, JSON.stringify(allItems, null, 2));

  console.log(`✅ Database exported - ${allItems.length} items saved to ${filename}`);

  // Export storage bucket files
  console.log("📁 Starting storage export...");

  // Load previous backup manifest (if exists)
  const manifestFile = "backup-manifest.json";
  let manifest = { files: {} };

  if (fs.existsSync(manifestFile)) {
    manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
    console.log("📋 Loaded existing backup manifest");
  } else {
    console.log("📋 No previous manifest found - will backup everything");
  }

  const buckets = ["inventory-images", "inventory-videos"];

  for (const bucketName of buckets) {
    console.log(`   📁 Analyzing ${bucketName}...`);

    let allFiles = [];
    let offset = 0;
    const limit = 100;

    // Get all current files
    while (true) {
      const { data: files, error } = await supabase.storage.from(bucketName).list("", {
        limit: limit,
        offset: offset,
      });

      if (error) {
        console.error(`❌ Error listing ${bucketName}:`, error.message);
        break;
      }

      if (files.length === 0) break;

      allFiles = [...allFiles, ...files];
      offset += limit;
    }

    // Compare with manifest to find changes
    const previousFiles = manifest.files[bucketName] || [];
    const previousFileMap = {};
    previousFiles.forEach((file) => {
      previousFileMap[file.name] = file;
    });

    let newFiles = [];
    let changedFiles = [];

    allFiles.forEach((currentFile) => {
      const previousFile = previousFileMap[currentFile.name];

      if (!previousFile) {
        // File is new
        newFiles.push(currentFile);
      } else if (currentFile.updated_at !== previousFile.updated_at) {
        // File was modified
        changedFiles.push(currentFile);
      }
    });

    console.log(
      `   📊 ${bucketName}: ${allFiles.length} total, ${newFiles.length} new, ${changedFiles.length} changed`
    );

    // Store current files in manifest for next time
    manifest.files[bucketName] = allFiles;
  }

  // Save updated manifest
  manifest.lastBackup = new Date().toISOString();
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));

  console.log("✅ Storage analysis complete - manifest updated");
} catch (error) {
  console.error("❌ Backup error:", error.message);
}

console.log("✅ Script runs successfully");

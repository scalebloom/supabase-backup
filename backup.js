import { createClient } from "@supabase/supabase-js";

console.log("Backup script starting...");

// Use valid URL format for testing (fake but valid format)
const supabaseUrl = "https://fake-project.supabase.co";
const supabaseKey = "fake-key-for-testing-purposes-only";

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("✅ Supabase client created");
console.log("✅ Script runs successfully");

// `npm run db:seed`: rebuilds the demo data from the command line. The same
// seed runs nightly from /api/cron/reset; see src/lib/demo/seed.ts.
//
// A standalone script, outside Next's module graph, so it creates its own
// client rather than using src/lib/db/client.ts (which imports "server-only").

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/db/types";
import { seedDemo } from "../src/lib/demo/seed";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
  );
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

seedDemo(supabase, new Date(), console.log)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

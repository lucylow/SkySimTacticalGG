// This file is for background job processing - disabled in frontend build
// These RPC functions would need to exist in the database for this to work

export async function processBatch() {
  console.log('Background job processing is disabled in frontend build');
  console.log('Use a separate Node.js/Deno process to run this job');
}

// One-off migration: renames old Consultation.service / BlogPost.category
// enum values to the new spec-v3 taxonomy. Safe to run more than once
// (subsequent runs simply find 0 matching documents for already-migrated values).
//
// Usage:
//   node scripts/migrateEnumValues.js            (live run)
//   DRY_RUN=1 node scripts/migrateEnumValues.js   (count only, no writes)
require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const Consultation = require('../models/Consultation');
const BlogPost = require('../models/BlogPost');

const CONSULTATION_MAP = {
  EB1A: 'EB-1A',
  EB1B: 'EB-1B',
  EB1C: 'EB-1C',
  'EB2-NIW': 'EB-2 NIW',
  'Investor Visa': 'Not Sure / Need Guidance',
  'Not sure yet': 'Not Sure / Need Guidance',
};

const BLOG_MAP = {
  EB1A: 'EB-1A',
  'EB2-NIW': 'EB-2 NIW',
  EB1B: 'Immigration Tips',
  EB1C: 'Immigration Tips',
  'Investor Visa': 'Immigration Tips',
  General: 'Immigration Tips',
};

async function migrateCollection(Model, field, map, label) {
  console.log(`\n[migrate] ${label}:`);
  let totalMatched = 0;
  for (const [oldValue, newValue] of Object.entries(map)) {
    const filter = { [field]: oldValue };
    const count = await Model.countDocuments(filter);
    if (count === 0) continue;
    totalMatched += count;
    if (process.env.DRY_RUN) {
      console.log(`  [dry-run] ${oldValue} -> ${newValue}: ${count} document(s) would be updated`);
    } else {
      const result = await Model.updateMany(filter, { $set: { [field]: newValue } });
      console.log(`  ${oldValue} -> ${newValue}: ${result.modifiedCount} document(s) updated`);
    }
  }
  if (totalMatched === 0) console.log('  Nothing to migrate — already up to date.');
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[migrate] MONGODB_URI is not set in .env. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log('[migrate] Connected to MongoDB.' + (process.env.DRY_RUN ? ' (DRY RUN — no writes will be made)' : ''));

  await migrateCollection(Consultation, 'service', CONSULTATION_MAP, 'Consultation.service');
  await migrateCollection(BlogPost, 'category', BLOG_MAP, 'BlogPost.category');

  console.log('\n[migrate] Done.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('[migrate] Failed:', err);
  process.exit(1);
});

import { initializeApp, cert } from 'firebase-admin/app';
import { getSecurityRules } from 'firebase-admin/security-rules';
import { readFileSync } from 'fs';

// Load service account from the desktop project
const serviceAccount = JSON.parse(readFileSync('./SRD-DESKTOP/src/main/resources/service-account.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const rules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
`;

async function main() {
  try {
    console.log("⏳ Deploying Firestore Security Rules programmatically...");
    const securityRules = getSecurityRules();
    await securityRules.releaseFirestoreRulesetFromSource(rules);
    console.log("🎉 Firestore Security Rules deployed successfully! Web app now has full read/write access.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to deploy security rules:", error);
    process.exit(1);
  }
}

main();

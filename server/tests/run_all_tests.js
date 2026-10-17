import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testSuites = [
  { name: 'Full-Stack Security & Vulnerability Hardening', file: 'test_security_hardening.js' },
  { name: 'Strict Payment Verification & Reconciliation Edge Cases', file: 'test_payment_verification_edge_cases.js' },
  { name: 'Upload Protection & Skill ZIP Security', file: 'test_upload_and_zip_security.js' },
  { name: 'End-to-End SaaS Business Flow Acceptance', file: 'test_e2e_full_business_flow.js' },
  { name: 'Commercial Pricing & Store Bundles', file: 'test_commercial_pricing.js' },
  { name: 'VietQR Real Payment & Admin Verification', file: 'test_vietqr_payment.js' },
  { name: 'Production Hardening & Resource Quota Tracking', file: 'test_production_hardening.js' }
];

async function runSuite(suite) {
  const filePath = path.join(__dirname, suite.file);
  return new Promise((resolve) => {
    console.log(`\n=================================================================`);
    console.log(`▶ RUNNING SUITE: ${suite.name} (${suite.file})`);
    console.log(`=================================================================`);
    const proc = spawn('node', [filePath], {
      stdio: 'inherit',
      env: process.env
    });
    proc.on('close', (code) => {
      resolve({ name: suite.name, file: suite.file, passed: code === 0, code });
    });
  });
}

async function main() {
  console.log(`\n=================================================================`);
  console.log(`🧪 TRÍ AI SAAS PLATFORM — MASTER AUTOMATED TEST RUNNER`);
  console.log(`=================================================================`);

  const results = [];
  for (const suite of testSuites) {
    const res = await runSuite(suite);
    results.push(res);
    if (!res.passed) {
      console.error(`\n❌ TEST SUITE FAILED: ${suite.name}`);
      break;
    }
  }

  console.log(`\n=================================================================`);
  console.log(`📊 MASTER TEST RESULTS SUMMARY`);
  console.log(`=================================================================`);
  let allPassed = true;
  for (const r of results) {
    const symbol = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${symbol} : ${r.name} (${r.file})`);
    if (!r.passed) allPassed = false;
  }
  console.log(`=================================================================`);

  if (allPassed && results.length === testSuites.length) {
    console.log(`🎉 100% OF ALL TEST SUITES PASSED CLEANLY! SYSTEM ACCEPTANCE VERIFIED.\n`);
    process.exit(0);
  } else {
    console.error(`💥 ONE OR MORE TEST SUITES FAILED.\n`);
    process.exit(1);
  }
}

main();

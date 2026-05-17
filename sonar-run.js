const scanner = require('sonarqube-scanner');

// Use env var for token — do not hardcode in source control
const token = process.env.SONAR_TOKEN;

async function runSonar() {
  try {
    await scanner.default({
      serverUrl: process.env.SONAR_HOST_URL || 'http://localhost:9000/',
      token,
      options: {
        'sonar.projectKey': 'saas-application',
        'sonar.projectName': 'Saas-Application',
        'sonar.projectVersion': '1.0',
        'sonar.sources': 'backend/src,frontend/src',
        'sonar.tests': 'backend/src,frontend/src',
        'sonar.test.inclusions': '**/*.spec.ts,**/*.spec.tsx,**/*.test.ts,**/*.test.tsx',
        'sonar.exclusions': '**/node_modules/**,**/.next/**,**/dist/**,**/prisma/**,**/coverage/**',
        'sonar.javascript.lcov.reportPaths': 'frontend/coverage/lcov.info,backend/coverage/lcov.info',
        'sonar.typescript.tsconfigPath': 'frontend/tsconfig.json',
        'sonar.javascript.environments': 'node',
      },
    });
    console.log('\n✅ SonarQube analysis complete!');
    console.log('📊 View results at: http://localhost:9000/dashboard?id=saas-application');
  } catch (err) {
    console.error('❌ SonarQube scan failed:', err.message);
    process.exit(1);
  }
}

runSonar();

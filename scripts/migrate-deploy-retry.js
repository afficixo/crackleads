const { spawn } = require('node:child_process');

const maxAttempts = 10;
const retryDelaysMs = [15000, 30000, 60000, 90000, 120000, 120000, 120000, 120000, 120000];
const prismaCli = require.resolve('prisma/build/index.js');

function getMigrationDatabaseUrl() {
  if (process.env.DIRECT_DATABASE_URL) {
    return process.env.DIRECT_DATABASE_URL;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return undefined;
  }

  try {
    const url = new URL(databaseUrl);
    if (url.hostname.includes('-pooler.')) {
      url.hostname = url.hostname.replace('-pooler.', '.');
      return url.toString();
    }
  } catch {
    return databaseUrl;
  }

  return databaseUrl;
}

function getMigrationEnvironment() {
  const migrationDatabaseUrl = getMigrationDatabaseUrl();
  return {
    ...process.env,
    ...(migrationDatabaseUrl ? { DATABASE_URL: migrationDatabaseUrl } : {}),
  };
}

function checkMigrationStatus() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [prismaCli, 'migrate', 'status'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: getMigrationEnvironment(),
    });
    let output = '';

    child.stdout.on('data', (chunk) => {
      output += chunk;
    });
    child.stderr.on('data', (chunk) => {
      output += chunk;
    });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      resolve({ code: code ?? (signal ? 1 : 0), output });
    });
  });
}

function runMigration() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [prismaCli, 'migrate', 'deploy'], {
      stdio: 'inherit',
      env: getMigrationEnvironment(),
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      resolve(code ?? (signal ? 1 : 0));
    });
  });
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function main() {
  const status = await checkMigrationStatus();
  process.stdout.write(status.output);
  if (status.code === 0 && status.output.includes('Database schema is up to date!')) {
    console.log('No pending database migrations; skipping migrate deploy.');
    return;
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const exitCode = await runMigration();

    if (exitCode === 0) {
      return;
    }

    if (attempt < maxAttempts) {
      const baseDelayMs = retryDelaysMs[attempt - 1];
      const jitterMs = Math.floor(Math.random() * Math.min(15000, baseDelayMs * 0.2));
      const waitMs = baseDelayMs + jitterMs;
      console.warn(`Prisma migration failed; retrying in ${(waitMs / 1000).toFixed(1)}s (attempt ${attempt + 1}/${maxAttempts}).`);
      await delay(waitMs);
    } else {
      process.exitCode = exitCode;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
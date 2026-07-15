const { spawn } = require('child_process');
const http = require('http');

const ROUTES = [
  '/',
  '/login',
  '/signup',
  '/dashboard',
  '/dashboard/account-management',
  '/dashboard/alerts',
  '/dashboard/budget',
  '/dashboard/budget/food',
  '/dashboard/budget/customize',
  '/dashboard/goals',
  '/dashboard/notifications',
  '/dashboard/projects',
  '/dashboard/reports',
  '/dashboard/reports/scheduled',
  '/dashboard/transactions',
];

const PORT = process.env.PORT || 3000;

function waitForServer(maxRetries = 120, interval = 1000) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const check = () => {
      const req = http.request(
        `http://localhost:${PORT}/`,
        { method: 'GET', timeout: 2000 },
        (res) => {
          resolve();
        }
      );
      req.on('error', () => {
        retries++;
        if (retries >= maxRetries) {
          reject(new Error(`Dev server did not start within ${maxRetries * interval / 1000}s`));
        } else {
          setTimeout(check, interval);
        }
      });
      req.on('timeout', () => {
        req.destroy();
        retries++;
        if (retries >= maxRetries) {
          reject(new Error(`Dev server did not start within ${maxRetries * interval / 1000}s`));
        } else {
          setTimeout(check, interval);
        }
      });
      req.end();
    };
    check();
  });
}

function prewarmRoutes() {
  let completed = 0;
  const total = ROUTES.length;
  const results = new Array(total);

  return new Promise((resolve) => {
    ROUTES.forEach((route, index) => {
      const req = http.get(`http://localhost:${PORT}${route}`, (res) => {
        results[index] = { route, statusCode: res.statusCode };
        completed++;
        if (completed === total) {
          resolve(results);
        }
      });
      req.on('error', (err) => {
        results[index] = { route, statusCode: err.message };
        completed++;
        if (completed === total) {
          resolve(results);
        }
      });
    });
  });
}

async function main() {
  console.log('Starting Next.js dev server...');
  const dev = spawn('next', ['dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd(),
  });

  try {
    await waitForServer();
    console.log('Dev server ready. Prewarming routes...\n');
    const results = await prewarmRoutes();
    results.forEach(({ route, statusCode }) => {
      console.log(`  ${route} -> ${statusCode}`);
    });
    console.log('\nRoute prewarming complete.');
  } catch (err) {
    console.error(`\nPrewarming failed: ${err.message}`);
  }

  dev.on('exit', (code) => process.exit(code));
  process.on('SIGINT', () => {
    dev.kill('SIGINT');
  });
  process.on('SIGTERM', () => {
    dev.kill('SIGTERM');
  });
}

main();

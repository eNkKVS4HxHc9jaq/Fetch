import { Environment } from './Environment.js';

const ENVIRONMENT = 'lan'.toLowerCase();

// Guard
if (!ENVIRONMENT) { console.error('Failed to execute script. Environment is missing or likely not defined in environment variables!'); process.exit(1) }

const PORT = 8000;
const HOST = 'localhost';

console.log(`Starting development server on http://${HOST}:${PORT}...`);

// Prepare server & environment variables
const server = Environment.execute('php', ['-S', `${HOST}:${PORT}`, 'index.php'], {
    env: {
        ...process.env,
        APP_ENV: ENVIRONMENT,
        SERP_API_KEY: Environment.resolve('SERP_API_KEY', ENVIRONMENT)
    }
}, false);

server.on('error', (error) => {
    console.error('Failed to start server. Make sure PHP is installed and added in PATH.');

    console.error(error);
});

// Handle graceful termination (Ctrl+C)
const exit = () => {
    console.log('\nShutting down PHP server...');

    server.kill();
    process.exit();
};

process.on('SIGINT', exit);
process.on('SIGTERM', exit);
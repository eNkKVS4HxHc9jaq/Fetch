import { parseArgs } from 'util';
import { Environment } from '../../Environment.js';

// Options
const options = {
    environment: {
        type: 'string'
    }
}

// Arguments
const { values } = parseArgs({
    args: process.argv.slice(2),
    options,
    strict: false
})

const ENVIRONMENT = values.environment?.toLowerCase()

// Guard
if (!ENVIRONMENT) { console.error('Failed to process. Environment definition missing. Required flag "--environment" was not passed from parent process!'); process.exit(1) }

const env_path = Environment.file(ENVIRONMENT);

// Guard
if (!env_path) { console.error(`Environment file not found at path: ${env_path}`); process.exit(1); }

// Environment variables
const content = Environment.content(ENVIRONMENT);
console.info('\n> Parsing environment variables...', content)

// Parse
const environment_variables = Object.entries(content).map(([ key, val ]) => `${key}=${val}`)

/**
 * Variables
 */
console.info('\n> Uploading environment variables...')
Environment.execute('npx', ['railway', 'variable', 'set', ...environment_variables]);

/**
 * Service
 */
console.info('\n> Deploying service...')
Environment.execute('npx', ['railway', 'up']);
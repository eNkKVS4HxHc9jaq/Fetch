import fs from 'fs';
import path from 'path';
import ignore from 'ignore';
import { Environment } from './Environment.js';

const ENVIRONMENT = 'wan'.toLowerCase();
const PROVIDER = Environment.resolve('CLOUD_PROVIDER', ENVIRONMENT)?.toLowerCase();

// Guard
if (!ENVIRONMENT) { console.error('Failed to execute script. Environment is missing or likely not defined in environment variables!'); process.exit(1) }
if (!PROVIDER) { console.error('Failed to execute script. Cloud provider is missing or likely not defined in environment variables!'); process.exit(1) }

console.info('\nPackaging project...');

const root_dir = Environment.root();
const public_dir = path.join(root_dir, 'public');

// Purge public
if (fs.existsSync(public_dir)) {
    fs.rmSync(public_dir, { recursive: true, force: true });
}
fs.mkdirSync(public_dir, { recursive: true });

const ig = ignore();

// Load ignore rules
for (const ignore of ['.gitignore', '.railwayignore']) {
    const file_path = path.join(root_dir, ignore);

    if (fs.existsSync(file_path)) {
        ig.add(fs.readFileSync(file_path, 'utf8'));
    }
}

// Exclude public from ignore
ig.add(['public/', 'public/**']);

// Copy non-ignored files to public
function copy(source_dir, destination_dir, current = '') {
    const entries = fs.readdirSync(source_dir, { withFileTypes: true });

    for (const entry of entries) {
        const relativePath = path.join(current, entry.name);

        // Skip ignored paths
        if (ig.ignores(relativePath) || ig.ignores(`${relativePath}/`)) continue;

        const source_path = path.join(source_dir, entry.name);
        const destination_path = path.join(destination_dir, entry.name);

        if (entry.isDirectory()) {
            fs.mkdirSync(destination_path, { recursive: true });
            
            copy(source_path, destination_path, relativePath);
        } else {
            fs.copyFileSync(source_path, destination_path);
        }
    }
}

copy(root_dir, public_dir);

console.info(`\nDeploying to cloud provider: "${PROVIDER}"`)

try {
    switch (PROVIDER) {
        case 'railway': {
            console.info('Routing deployment pipeline to Railway...')

            const deploy = Environment.execute('node', [path.join(root_dir, 'Scripts', 'Cloud', 'Railway', 'RailwayService.js'), '--environment', ENVIRONMENT]);

            if (deploy.status !== 0) {
                console.error(`Deployment script failed with status code: ${deploy.status}`);

                process.exit(deploy.status || 1);
            }

            break
        }

        default:
            console.error(`Failed to deploy! Unsupported cloud provider configured: "${PROVIDER}"`)

            process.exit(1)
    }
} catch (error) {
    console.error(`Deployment failed! Error: ${error}`)

    process.exit(1)
}
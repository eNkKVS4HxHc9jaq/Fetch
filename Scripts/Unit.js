import path from 'path'
import { Environment } from './Environment.js'

const ENVIRONMENT = 'lan'.toLowerCase();
const root_dir = Environment.root()
const unit = path.join(root_dir, 'Unit.php')

console.log('Executing unit test...')

// Execute PHPUnit
Environment.execute(
    'composer',
    ['exec', 'phpunit', '--', '--testdox', unit],
    {
        shell: true,
        env: {
            ...process.env,
            APP_ENV: ENVIRONMENT,
            SERP_API_KEY: Environment.resolve('SERP_API_KEY', ENVIRONMENT)
        }
    }
);
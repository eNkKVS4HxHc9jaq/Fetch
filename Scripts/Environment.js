import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { spawn, spawnSync } from 'child_process'

const Environment = {
    file (mode) {
        const root = this.root()

        // Guard
        if (!root) return null

        if (mode) {
            mode = mode.toLowerCase()

            const file = path.join(root, `.env.${mode}`)

            if (fs.existsSync(file)) {
                return file
            }
        }

        return path.join(root, '.env')
    },

    root () {
        const filename = fileURLToPath(import.meta.url)
        let directory = path.dirname(filename)

        // Climb up directories until "ROOT" is found
        while (directory !== path.parse(directory).root) {
            if (fs.existsSync(path.join(directory, 'ROOT'))) {
                return directory
            }

            directory = path.dirname(directory)
        }

        // Fallback: Final check at the filesystem root level
        if (fs.existsSync(path.join(directory, 'ROOT'))) {
            return directory
        }

        console.error('Failed to determine root directory. The "ROOT" file was not found in any parent directory.')
    },

    platform () {
        const platform = process.platform

        if (platform === 'win32') {
            return 'windows'
        } else if (platform === 'darwin') {
            return 'macos'
        } else if (platform === 'linux') {
            return 'linux'
        }

        // Fallback
        return platform
    },

    execute (binary = 'npx', args = [], options = {}, synchronous = true) {
        let command = binary
        let shell = false

        if (binary === 'npx') {
            command = this.platform() === 'windows' ? 'npx.cmd' : 'npx'
            shell = true
        }

        const faulty_args = args.filter(argument => argument === undefined || argument === null).join(',')

        // Guard
        if (faulty_args.length) { console.error('Failed to execute command. Invalid arguments provided:', faulty_args); return }

        // Spawn
        let process
        if (synchronous) {
            process = spawnSync(command, args, {
                stdio: 'inherit',
                shell: shell,
                cwd: this.root(),
                ...options
            })

            // Fail-safe error handling
            if (process.error) {
                console.error(`Failed to execute ${command} synchronously:`, process.error.message)
            }
        } else {
            process = spawn(command, args, {
                stdio: 'inherit',
                shell: shell,
                cwd: this.root(),
                ...options
            })

            // Fail-safe error handling
            process.on('error', error => {
                console.error(`Failed to execute ${command} asynchronously:`, error.message)
            })
        }

        return process
    },

    resolve (key, mode) {
        const file = this.file(mode)

        // Guard
        if (!file) return

        const parsed = this.parse(file)

        // Sync parsed values back to process
        for (const [ key, val ] of Object.entries(parsed)) {
            process.env[key] = val
        }

        const _key = key

        // Guard
        if (!key) {
            console.error(`Failed to resolve environment variable "${_key}" as the passed key is empty! It is either null or undefined or not provided!`)

            return null
        }

        let result = process.env[key]

        // Guard
        if (result === null || result === undefined) {
            console.error(`Failed to resolve environment variable "${_key}" as the resolved value is empty! It is either null or undefined!`)

            return null
        }

        result = String(result)

        if (result.includes(',')) {
            result = result.split(',')
        }

        if (Array.isArray(result)) {
            result = result.map(item => item.trim())
        } else {
            result = result.trim()
        }

        return result
    },

    content (mode) {
        const file = this.file(mode)

        // Guard
        if (!file) return {}

        return this.parse(file)
    },

    parse (file) {
        let result = {}

        // Load and parse environment file
        if (fs.existsSync(file)) {
            const parsed = dotenv.parse(fs.readFileSync(file))

            const expanded = dotenvExpand.expand({ parsed: parsed, processEnv: { ...process.env, ...result } })

            result = expanded.parsed
        }

        return result
    }
}

export { Environment }

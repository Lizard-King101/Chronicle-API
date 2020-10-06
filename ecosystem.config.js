module.exports = {
    apps: [
        {
            name: 'nPanel',
            script: './index.js',
            error_file: 'error.log',
            log_file: 'log.log',
            env: {
                deploy: true
            }
        }
    ]
}

pipeline {
    agent any
    
    triggers { githubPush() }

    tools {nodejs "NodeJS"}

    options{
        ansiColor('xterm')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Install dependencies') {
            steps {
                sh 'npm install'
            }
        }
        stage('Test with Jest') {
            steps {
                script {
                    try {
                        sh 'npm run test | tee tests.log'
                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        throw e
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                def discordNotifier = new jenkins.plugins.discord.DiscordNotifier()
                def logContent = readFile('tests.log').trim()
                def branchName = env.BRANCH_NAME
                def userName = env.CHANGE_AUTHOR
                def buildNumber = env.BUILD_NUMBER
                
                discordNotifier.with {
                    webhookURL = 'https://discord.com/api/webhooks/1123840483098099712/9bsMKXxHUaPmQzLXgY4I9Q2QDRjA1sbd67ywY79ruhzQpFBmQJZghtdw2T15XXEur00q'
                    title = "${env.JOB_NAME}"
                    content = """
                        Branch: ${branchName}
                        User: ${userName}
                        Log Content:
                        ${logContent}
                    """
                    footer = "Build Number: ${buildNumber}"
                }.send()
            }
        }
    }
}

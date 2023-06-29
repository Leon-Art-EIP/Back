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
                def logContent = readFile('tests.log').trim()
                def branchName = env.BRANCH_NAME
                def userName = env.CHANGE_AUTHOR
                def buildNumber = env.BUILD_NUMBER
                
                discordSend(
                    webhookURL: "https://discord.com/api/webhooks/1123841672338489374/tlaGCd28bNClNt7Q9TRggy2Mep292PSpNkfzVStWRSvY3fepJqeJ70wjuPgyTU8A_Z3D",
                    title: "${env.JOB_NAME}",
                    description: """
                        Branch: ${branchName}
                        User: ${userName}
                        Log Content:
                        ${logContent}
                    """,
                    footer: "Build Number: ${buildNumber}",
                    result: currentBuild.currentResult
                )
            }
        }
    }
}

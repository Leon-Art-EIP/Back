pipeline {
    agent {
        label 'docker-slave'
    }

    triggers {
        githubPush()
    }

    tools {
        nodejs "node"
    }

    options {
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
                sh 'sudo chown -R 110:117 "/.npm"'
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

        stage('Post-Test Actions') {
            steps {
                sh 'npm install jest-coverage-ratchet'
                sh 'sed -r "s/\\x1B\\[([0-9]{1,2}(;[0-9]{1,2})?)?[mGK]//g" tests.log > tests_clean.log'
                sh 'npx jest-coverage-ratchet || (echo "Jest tests did not reach 100% coverage" && exit 1)'
            }
        }

        stage('Push to DockerHub') {
            when {
                branch 'dev'
            }
            steps {
                script {
                    try {
                        echo "Pushing to DockerHub..."
                        sh "docker build -t ${DOCKER_USERNAME}/${DOCKER_REPO_DEV_BACK}:latest -t ${DOCKER_USERNAME}/${DOCKER_REPO_DEV_BACK}:${BUILD_NUMBER} ."
                        sh "docker login -u ${DOCKER_USERNAME} -p ${DOCKER_PASSWORD}"
                        sh "docker push ${DOCKER_USERNAME}/${DOCKER_REPO_DEV_BACK}:latest"
                        sh "docker push ${DOCKER_USERNAME}/${DOCKER_REPO_DEV_BACK}:${BUILD_NUMBER}"
                    } catch(Exception e) {
                        echo "Stage failed due to exception: ${e}"
                        error("Failed to push to DockerHub.")
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                def logContent = "```\n" + readFile('tests_clean.log').trim() + "\n```"
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

            cleanWs(cleanWhenNotBuilt: false,
                    deleteDirs: true,
                    disableDeferredWipeout: true,
                    notFailBuild: true,
                    patterns: [[pattern: '.gitignore', type: 'INCLUDE'],
                               [pattern: '.propsfile', type: 'EXCLUDE']])

            junit '**/test-results/*.xml'
        }
    }
}

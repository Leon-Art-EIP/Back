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

    environment {
        GITHUB_TOKEN = credentials('bee8aec4-1e4e-441a-82b8-7b2b981237ac')
        NPM_TOKEN = credentials('npm-token')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install dependencies') {
            steps {
                sh 'sudo apt install openssl1.1 -y'
                sh 'npm install'
            }
        }

        // stage('Test with Jest') {
        //     steps {
        //         script {
        //             try {
        //                 sh 'npm run test | tee tests.log'
        //             } catch (Exception e) {
        //                 currentBuild.result = 'FAILURE'
        //                 throw e
        //             }
        //         }
        //     }
        // }

        stage('Post-Test Actions') {
            steps {
                sh 'npm install jest-coverage-ratchet'
                sh 'sed -r "s/\\x1B\\[([0-9]{1,2}(;[0-9]{1,2})?)?[mGK]//g" tests.log > tests_clean.log'
                sh 'npx jest-coverage-ratchet || (echo "Jest tests did not reach 100% coverage" && exit 1)'
            }
        }

        stage('Semantic Release') {
            steps {
                script {
                    try {
                        def semanticOutput = sh(script: "npx semantic-release", returnStdout: true).trim()
                        echo "Semantic Release Output: ${semanticOutput}"

                        // Extract the version from the semantic-release output
                        def versionMatch = semanticOutput =~ /(?<=v)[0-9]+\.[0-9]+\.[0-9]+(-dev\.[0-9]+)?/
                        if (versionMatch) {
                            env.VERSION = versionMatch[0]
                            echo "Next release version: ${env.VERSION}"
                        } else {
                            echo "No release version found. Skipping Docker build and push."
                            currentBuild.result = 'SUCCESS'
                            return
                        }
                    } catch (Exception e) {
                        echo "Semantic Release failed: ${e}"
                        currentBuild.result = 'FAILURE'
                        throw e
                    }
                }
            }
        }

        stage('Push to DockerHub') {
            when {
                branch 'dev'
                expression {
                    return env.VERSION != null && env.VERSION != ""
                }
            }
            steps {
                script {
                    try {
                        echo "Pushing to DockerHub..."
                        sh "docker build -t ${DOCKER_REPO_DEV_BACK}:latest -t ${DOCKER_REPO_DEV_BACK}:${env.VERSION}.${env.BUILD_NUMBER} ."
                        sh "echo ${DOCKER_PASSWORD} | docker login -u ${DOCKER_USERNAME} --password-stdin"
                        sh "docker push ${DOCKER_REPO_DEV_BACK}:latest"
                        sh "docker push ${DOCKER_REPO_DEV_BACK}:${env.VERSION}.${env.BUILD_NUMBER}"

                        echo "Pushed to DockerHub successfully."
                        echo "Cleaning workspace..."
                        sh "docker rmi ${DOCKER_REPO_DEV_BACK}:latest"
                        sh "docker rmi ${DOCKER_REPO_DEV_BACK}:${env.VERSION}.${env.BUILD_NUMBER}"

                        cleanWs(cleanWhenNotBuilt: false,
                                deleteDirs: true,
                                disableDeferredWipeout: true,
                                notFailBuild: true,
                                patterns: [[pattern: '.gitignore', type: 'INCLUDE'],
                                           [pattern: '.propsfile', type: 'EXCLUDE']])
                    } catch(Exception e) {
                        echo "Stage failed due to exception: ${e}"
                        error("Failed to push to DockerHub.")
                    }
                }
            }
            when {
                branch 'main'
                expression {
                    return env.VERSION != null && env.VERSION != ""
                }
            }
            steps {
                script {
                    try {
                        echo "Pushing to DockerHub..."
                        sh "docker build -t leonarteip/back-prod:latest -t leonarteip/back-prod:${env.VERSION}.${env.BUILD_NUMBER} ."
                        sh "echo ${DOCKER_PASSWORD} | docker login -u ${DOCKER_USERNAME} --password-stdin"
                        sh "docker push leonarteip/back-prod:latest"
                        sh "docker push leonarteip/back-prod:${env.VERSION}.${env.BUILD_NUMBER}"

                        echo "Pushed to DockerHub successfully."
                        echo "Cleaning workspace..."
                        sh "docker rmi leonarteip/back-prod:latest"
                        sh "docker rmi leonarteip/back-prod:${env.VERSION}.${env.BUILD_NUMBER}"

                        cleanWs(cleanWhenNotBuilt: false,
                                deleteDirs: true,
                                disableDeferredWipeout: true,
                                notFailBuild: true,
                                patterns: [[pattern: '.gitignore', type: 'INCLUDE'],
                                           [pattern: '.propsfile', type: 'EXCLUDE']])
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

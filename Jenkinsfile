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
                sh 'npm install jest-coverage-ratchet'
                sh 'npm run test'
                sh 'npx jest-coverage-ratchet || echo "Jest tests did not reach 100% coverage" && exit 1'
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
}

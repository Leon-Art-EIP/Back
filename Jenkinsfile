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
                sh 'npm run test'
            }
        }
         stage('Push to DockerHUb')
    {
      when { 
        branch 'dev'
      }
      steps{
        echo "Pushing to DockerHub..."
        sh "docker build -t ${DOCKER_USERNAME}/${DOCKER_REPO_DEV_BACK}:${BUILD_NUMBER} ."
        sh "docker login -u ${DOCKER_USERNAME} -p ${DOCKER_PASSWORD}"
        sh "docker push ${DOCKER_USERNAME}/${DOCKER_REPO_DEV_BACK}:${BUILD_NUMBER}"
      }
    }

    }
}

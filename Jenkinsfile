pipeline {
    agent any
    
    triggers { githubPush() }

    tools {nodejs "NodeJS"}

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

        stage('Start MongoDB') {
            steps {
                sh 'docker run --name mongodb -d mongo'
            }
        }

        stage('Test with Jest') {
            steps {
                sh 'npm run test'
            }
        }

        stage('Install Newman') {
            steps {
                sh 'npm install -g newman'
            }
        }

        stage('Test with Postman') {
            steps {
                sh "newman run ./test/postman/collection.json"
            }
        }
    }

    post {
        always {
            sh 'docker stop mongodb'
            sh 'docker rm mongodb'
        }
    }
}

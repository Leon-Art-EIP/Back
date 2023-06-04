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


        stage('Test with Jest') {
            steps {
                sh 'npm run test'
            }
        }

    }
}

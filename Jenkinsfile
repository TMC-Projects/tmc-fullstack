pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'njara-platform-api'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Lint') {
            steps {
                sh 'golangci-lint run ./...'
            }
        }

        stage('Test') {
            steps {
                sh 'go test -v -cover ./...'
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    sh "docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} ."
                    sh "docker build -t ${DOCKER_IMAGE}:latest ."
                }
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying to staging/production environment...'
                // For example: sh 'docker-compose up -d --build'
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Please check logs.'
        }
    }
}

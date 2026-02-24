pipeline {
    agent any

    environment {
        DOCKER_HUB_CREDENTIALS = 'docker-hub-creds' // Jenkins Docker Hub credentials ID
        BACKEND_IMAGE = 'chtwirls/edu-backend:latest'
        FRONTEND_IMAGE = 'chtwirls/edu-frontend:latest'
    }

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Verify Docker') {
            steps {
                sh 'docker version'
            }
        }

        // --- Backend ---
        stage('Build Backend Jar') {
            steps {
                dir('backend') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Build & Push Backend Docker Image') {
            steps {
                dir('backend') {
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_HUB_CREDENTIALS}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                        sh "docker build -t ${BACKEND_IMAGE} ."
                        sh "docker push ${BACKEND_IMAGE}"
                        sh "docker rmi ${BACKEND_IMAGE} || true"
                    }
                }
            }
        }

        // --- Frontend ---
        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Build & Push Frontend Docker Image') {
            steps {
                dir('frontend') {
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_HUB_CREDENTIALS}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                        sh "docker build -t ${FRONTEND_IMAGE} ."
                        sh "docker push ${FRONTEND_IMAGE}"
                        sh "docker rmi ${FRONTEND_IMAGE} || true"
                    }
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline finished!"
        }
        success {
            echo "✅ Backend and Frontend Docker images pushed successfully!"
        }
        failure {
            echo "❌ Pipeline failed. Check logs for errors."
        }
    }
}
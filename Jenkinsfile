pipeline {
    agent any

    tools {
        jdk 'jdk17'
        nodejs 'node16'
    }

    environment {
        SCANNER_HOME = tool 'sonar-scanner'
        BACKEND_IMAGE = 'tiendatdev94/click-app-backend'
        FRONTEND_IMAGE = 'tiendatdev94/click-app-frontend'
        DB_IMAGE = 'tiendatdev94/click-app-db'
        DOCKER_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Checkout Source') {
            steps {
                git branch: 'main', url: 'https://github.com/dat94-03/CICD-app'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonar-server') {
                    sh '''
                        echo "Running Sonar Scanner..."
                        $SCANNER_HOME/bin/sonar-scanner \
                        -Dsonar.projectName=Clickapp \
                        -Dsonar.projectKey=Clickapp
                    '''
                }
            }
        }

        // stage('Quality Gate') {
        //     steps {
        //         script {
        //             def qg = waitForQualityGate(abortPipeline: true, credentialsId: 'Sonar-token')
        //             if (qg.status != 'OK') {
        //                 error "Sonar Quality Gate failed: ${qg.status}"
        //             }
        //         }
        //     }
        // }

        stage('Install Dependencies') {
            steps {
                dir('backend') {
                    sh 'npm install'
                }
                dir('frontend') {
                    sh 'npm install'
                }
            }
        }

        stage('Trivy Filesystem Scan') {
            steps {
                sh '''
                    echo "Running Trivy FS scan..."
                    trivy fs . > trivyfs.txt
                '''
            }
        }

        stage('Docker Build & Push') {
            steps {
                script {
                    withDockerRegistry(credentialsId: 'docker', toolName: 'docker') {
                        // Backend
                        dir('backend') {
                            sh '''
                                echo "Building backend Docker image..."
                                docker build -t ${BACKEND_IMAGE}:${DOCKER_TAG} .
                                echo "Pushing backend Docker image..."
                                docker push ${BACKEND_IMAGE}:${DOCKER_TAG}
                            '''
                        }
                        // Frontend
                        dir('frontend') {
                            sh '''
                                echo "Building frontend Docker image..."
                                docker build -t ${FRONTEND_IMAGE}:${DOCKER_TAG} .
                                echo "Pushing frontend Docker image..."
                                docker push ${FRONTEND_IMAGE}:${DOCKER_TAG}
                            '''
                        }
                        // DB
                        dir('db') {
                            sh '''
                                echo "Building db Docker image..."
                                docker build -t ${DB_IMAGE}:${DOCKER_TAG} .
                                echo "Pushing db Docker image..."
                                docker push ${DB_IMAGE}:${DOCKER_TAG}
                            '''
                        }
                    }
                }
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh '''
                    echo "Running Trivy image scan for backend..."
                    trivy image ${BACKEND_IMAGE}:${DOCKER_TAG} > trivyimage-backend.txt || echo "Trivy image scan failed or not installed"
                    echo "Running Trivy image scan for frontend..."
                    trivy image ${FRONTEND_IMAGE}:${DOCKER_TAG} > trivyimage-frontend.txt || echo "Trivy image scan failed or not installed"
                    echo "Running Trivy image scan for db..."
                    trivy image ${DB_IMAGE}:${DOCKER_TAG} > trivyimage-db.txt || echo "Trivy image scan failed or not installed"
                '''
            }
        }

        // You may want to update the deploy stages to use the new images as needed
    }

    post {
        always {
            emailext(
                attachLog: true,
                subject: "'${currentBuild.result}' Build Report",
                body: """
                    <p><b>Project:</b> ${env.JOB_NAME}</p>
                    <p><b>Build Number:</b> ${env.BUILD_NUMBER}</p>
                    <p><b>URL:</b> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                """,
                to: 'tiendat942003@gmail.com',
                attachmentsPattern: 'trivyfs.txt,trivyimage-backend.txt,trivyimage-frontend.txt,trivyimage-db.txt'
            )
        }
    }
}
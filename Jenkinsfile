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
        //             def qg = waitForQualityGate()
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
        // stage('Run Tests') {
        //     steps {
        //         dir('backend') {
        //             sh 'npm test'
        //         }
        //         dir('frontend') {
        //             sh 'npm test'
        //         }
        //     }
        // }
        stage('Trivy Filesystem Scan') {
            steps {
                sh '''
                    echo "Running Trivy FS scan on backend..."
                    trivy fs backend > trivyfs-backend.txt
                    echo "Running Trivy FS scan on frontend..."
                    trivy fs frontend > trivyfs-frontend.txt
                '''
            }
        }

        stage('Docker Build & Push') {
            steps {
                script {
                    withDockerRegistry(credentialsId: 'docker', toolName: 'docker') {
                        dir('backend') {
                            sh """
                                docker build -t ${BACKEND_IMAGE}:${DOCKER_TAG} .
                                docker push ${BACKEND_IMAGE}:${DOCKER_TAG}
                            """
                        }
                        dir('frontend') {
                            sh """
                                docker build -t ${FRONTEND_IMAGE}:${DOCKER_TAG} .
                                docker push ${FRONTEND_IMAGE}:${DOCKER_TAG}
                            """
                        }
                        dir('db') {
                            sh """
                                docker build -t ${DB_IMAGE}:${DOCKER_TAG} .
                                docker push ${DB_IMAGE}:${DOCKER_TAG}
                            """
                        }
                    }
                }
            }
        }
        stage('Trivy Image Scan') {
            steps {
                sh """
                    trivy image --severity CRITICAL,HIGH ${BACKEND_IMAGE}:${DOCKER_TAG} > trivyimage-backend.txt || exit 1
                    trivy image --severity CRITICAL,HIGH ${FRONTEND_IMAGE}:${DOCKER_TAG} > trivyimage-frontend.txt || exit 1
                    trivy image --severity CRITICAL,HIGH ${DB_IMAGE}:${DOCKER_TAG} > trivyimage-db.txt || exit 1
                """
            }
        }

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
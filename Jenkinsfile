pipeline {
    agent any

    tools {
        jdk 'jdk17'
        nodejs 'node16'
    }

    environment {
        SCANNER_HOME = tool 'sonar-scanner'
        DOCKER_IMAGE = 'tiendatdev94/netflix'
        DOCKER_TAG = 'latest'
        TMDB_API_KEY = 'Aj7ay86fe14eca3e76869b92'
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
                        -Dsonar.projectName=Netflix \
                        -Dsonar.projectKey=Netflix
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                script {
                    def qg = waitForQualityGate(abortPipeline: false, credentialsId: 'Sonar-token')
                    if (qg.status != 'OK') {
                        error "Sonar Quality Gate failed: ${qg.status}"
                    }
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Trivy Filesystem Scan') {
            steps {
                sh '''
                    echo "Running Trivy FS scan..."
                    trivy fs . > trivyfs.txt || echo "Trivy FS scan failed or not installed"
                '''
            }
        }

        stage('Docker Build & Push') {
            steps {
                script {
                    withDockerRegistry(credentialsId: 'docker', toolName: 'docker') {
                        sh '''
                            echo "Building Docker image..."
                            docker build --build-arg TMDB_V3_API_KEY=${TMDB_API_KEY} -t ${DOCKER_IMAGE}:${DOCKER_TAG} .
                            echo "Pushing Docker image..."
                            docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
                        '''
                    }
                }
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh '''
                    echo "Running Trivy image scan..."
                    trivy image ${DOCKER_IMAGE}:${DOCKER_TAG} > trivyimage.txt || echo "Trivy image scan failed or not installed"
                '''
            }
        }

        stage('Deploy to Local Container') {
            steps {
                script {
                    sh '''
                        echo "Stopping old container if it exists..."
                        docker stop netflix || true
                        docker rm netflix || true

                        echo "Starting new container..."
                        docker run -d --name netflix -p 8081:80 ${DOCKER_IMAGE}:${DOCKER_TAG}

                        echo "Waiting for app to be ready..."
                        sleep 20
                        curl -f http://localhost:8081 || echo "App might still be initializing"
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    dir('Kubernetes') {
                        withKubeConfig(credentialsId: 'k8s') {
                            sh '''
                                echo "Deploying to Kubernetes..."
                                kubectl apply -f deployment.yml
                                kubectl apply -f service.yml
                            '''
                        }
                    }
                }
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
                attachmentsPattern: 'trivyfs.txt,trivyimage.txt'
            )
        }
    }
}

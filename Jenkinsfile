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
        NAMESPACE = 'biglab'
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

        stage('Quality Gate') {
            steps {
                script {
                    def qg = waitForQualityGate()
                    if (qg.status != 'OK') {
                        error "Sonar Quality Gate failed: ${qg.status}"
                    }
                }
            }
        }

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
                            // Use Jenkins credentials for MongoDB build
                            withCredentials([
                                string(credentialsId: 'mongodb-username', variable: 'MONGO_USERNAME'),
                                string(credentialsId: 'mongodb-password', variable: 'MONGO_PASSWORD'),
                                string(credentialsId: 'mongodb-database', variable: 'MONGO_DATABASE')
                            ]) {
                                sh """
                                    docker build \
                                        --build-arg MONGO_INITDB_ROOT_USERNAME=\${MONGO_USERNAME} \
                                        --build-arg MONGO_INITDB_ROOT_PASSWORD=\${MONGO_PASSWORD} \
                                        --build-arg MONGO_INITDB_DATABASE=\${MONGO_DATABASE} \
                                        -t ${DB_IMAGE}:${DOCKER_TAG} .
                                    docker push ${DB_IMAGE}:${DOCKER_TAG}
                                """
                            }
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

        stage('Update GitOps with Secrets') {
            steps {
                script {
                    withCredentials([
                        usernamePassword(credentialsId: 'git-cre', 
                            usernameVariable: 'GIT_USERNAME', 
                            passwordVariable: 'GIT_PASSWORD'),
                        string(credentialsId: 'mongodb-username', variable: 'MONGO_USERNAME'),
                        string(credentialsId: 'mongodb-password', variable: 'MONGO_PASSWORD')
                    ]) {
                        sh """
                        GIT_URL="https://${GIT_USERNAME}:${GIT_PASSWORD}@github.com/dat94-03/gitops-click-app"
                        git clone "\$GIT_URL"
                        cd gitops-click-app

                        # Update Helm values.yaml with new image tags and credentials
                        yq -y --in-place '.backend.tag = "${DOCKER_TAG}"' click-app/values.yaml
                        yq -y --in-place '.frontend.tag = "${DOCKER_TAG}"' click-app/values.yaml
                        yq -y --in-place '.mongodb.tag = "${DOCKER_TAG}"' click-app/values.yaml
                        yq -y --in-place '.mongodb.username = "${MONGO_USERNAME}"' click-app/values.yaml
                        yq -y --in-place '.mongodb.password = "${MONGO_PASSWORD}"' click-app/values.yaml

                        # Commit and push changes
                        git config user.name "Jenkins CI"
                        git config user.email "tiendat942003@gmail.com"
                        git add click-app/values.yaml
                        git commit -m "🚀 Deploy to production: build ${BUILD_NUMBER} with secrets"
                        git push origin main
                    """
                    }
                }
            }
        }

    }

    post {
    always {
        cleanWs()
    }
    }
}
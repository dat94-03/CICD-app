pipeline{
    agent any
    tools{
        jdk 'jdk17'
        nodejs 'node16'
    }
    environment {
        SCANNER_HOME=tool 'sonar-scanner'
        DOCKER_IMAGE = "tiendatdev94/netflix"
        DOCKER_TAG = 'latest'
        TMDB_API_KEY = 'Aj7ay86fe14eca3e76869b92'
    }
    stages { // This is the main stages block
        stage('clean workspace'){
            steps{
                cleanWs()
            }
        }
        stage('Checkout from Git'){
            steps{
                git branch: 'main', url: 'https://github.com/dat94-03/CICD-app'
            }
        }
        // stage("Sonarqube Analysis "){
        //     steps{
        //         withSonarQubeEnv('sonar-server') {
        //             sh ''' $SCANNER_HOME/bin/sonar-scanner -Dsonar.projectName=Netflix \\
        //             -Dsonar.projectKey=Netflix '''
        //         }
        //     }
        // }
        // stage("quality gate"){
        //   steps {
        //         script {
        //             waitForQualityGate abortPipeline: false, credentialsId: 'Sonar-token'
        //         }
        //     }
        // }
        stage('Install Dependenciessss') {
            steps {
                sh "npm install"
            }
        }
        // stage('OWASP FS SCAN') {
        //     steps {
        //         dependencyCheck additionalArguments: '--scan ./ --disableYarnAudit --disableNodeAudit', odcInstallation: 'DP-Check'
        //         dependencyCheckPublisher pattern: '**/dependency-check-report.xml'
        //     }
        // }

        stage('TRIVY FS SCAN') {
            steps {
                sh "trivy fs . > trivyfs.txt"
            }
        }

        // DOCKER BUILD AND PUSH STAGES - ADD HERE
        stage("Docker Build & Push"){
            steps{
                script{
                   withDockerRegistry(credentialsId: 'docker', toolName: 'docker'){
                        sh "docker build --build-arg TMDB_V3_API_KEY=${TMDB_API_KEY} -t netflix ."
                        sh "docker tag netflix ${DOCKER_IMAGE}:${DOCKER_TAG}"
                        sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
                    }
                }
            }
        }

        stage("TRIVY Image Scan"){
            steps{
                sh "trivy image ${DOCKER_IMAGE}:${DOCKER_TAG} > trivyimage.txt"
            }
        }

        stage('Deploy to containerrrr'){
            steps{
                script {
                    // Stop and remove existing container if it exists
                    sh '''
                        docker stop netflix || true
                        docker rm netflix || true
                    '''

                    // Run new container
                    sh "docker run -d --name netflix -p 8081:80 ${DOCKER_IMAGE}:${DOCKER_TAG}"

                    // Optional: Wait and test if application is running
                    sh '''
                        sleep 30
                        curl -f http://localhost:8081 || echo "Application might still be starting..."
                    '''
                }
            }
        }
        // The "Deploy to Kubernetes" stage was incorrectly placed inside a new 'stages' block.
        // It's now correctly placed within the main 'stages' block.
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    dir('Kubernetes') {
                        withKubeConfig(caCertificate: '', clusterName: '', contextName: '', credentialsId: 'k8s', namespace: '', restrictKubeConfigAccess: false, serverUrl: '') {
                            sh 'kubectl apply -f deployment.yml'
                            sh 'kubectl apply -f service.yml'
                        }
                    }
                }
            }
        }
    } // End of the main stages block
    post {
      always {
        emailext attachLog: true,
            subject: "'${currentBuild.result}'",
            body: "Project: ${env.JOB_NAME}<br/>" +
                "Build Number: ${env.BUILD_NUMBER}<br/>" +
                "URL: ${env.BUILD_URL}<br/>",
            to: 'tiendat942003@gmail.com',
            attachmentsPattern: 'trivyfs.txt,trivyimage.txt'
        }
    }
}
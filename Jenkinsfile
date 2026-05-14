pipeline {
    agent any   

    environment {
        // Name of the SonarQube scanner tool configured in Jenkins Global Tool Configuration
        SONAR_SCANNER = tool 'SonarScanner'
    }

    stages {
        stage('Clone Code') {
            steps {
                echo 'Cloning source code from GitHub...'
                git branch: 'Dev',
                credentialsId: 'github-ssh',
                url: 'git@github.com:suriyaselvarajm/Saas-Application.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing Dependencies...'
                sh '''
                cd backend && npm install
                cd ../frontend && npm install
                # Ensure binaries have execute permissions on Linux
                chmod -R +x backend/node_modules/.bin || true
                chmod -R +x frontend/node_modules/.bin || true
                '''
            }
        }

        stage('Run Tests') {
            steps {
                echo 'Running Tests...'
                sh '''
                cd backend && npx jest --passWithNoTests
                cd ../frontend && npm test
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                echo 'Starting SonarQube Analysis...'
                // 'SonarQubeServer' must match the name configured in Jenkins System Settings
                withSonarQubeEnv('SonarQube') {
                    sh "${SONAR_SCANNER}/bin/sonar-scanner"
                }
            }
        }
        
        stage('Quality Gate') {
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    // Optional: Wait for SonarQube to finish processing and fail if Quality Gate fails
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }
}

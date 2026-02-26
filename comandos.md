# Comandos Úteis do Projeto

## Mobile

### Limpar Cache
- `npx expo prebuild --clean --platform android --no-install`
- `cd android; .\gradlew.bat clean`

### Roda o projeto
- `$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"`
- `npx expo run:android`

### Obter/Criar credenciais (SHA-1)
- `npx eas credentials -p android`

### Obter/Criar credenciais (SHA-1) com npx expo run:android
- `./gradlew signingReport`

### build EAS
- `eas build -p android --profile preview`
- `eas build --profile preview --platform ios`
- `eas build -p android --profile production`
- `eas build --profile development --platform android`
- `eas build --profile production --platform ios`

#### build EAS para produção
- `eas build -p ios --profile production-ios`
- `eas build -p android --profile production-android`

### update EAS
- `eas update --branch production --message "ajustes player screed"`

#### update EAS OTA para produção por plataforma
- `eas update --branch production-ios --message "..."`
- `eas update --branch production-android --message "..."`

### build docker frontned
- `docker build -f Dockerfile -t ninaro-frontend:v1.0.3 .`
- `docker save -o "C:/Users/Douglas/Desktop/wizer/MVPs/images/ninaro-frontend.tar" ninaro-frontend:v1.0.3`

### build docker backend
- `docker build -f Dockerfile -t ninaro-backend:v1.0.3 .`
- `docker save -o "C:/Users/Douglas/Desktop/wizer/MVPs/images/ninaro-backend.tar" ninaro-backend:v1.0.3`

### build docker worker
- `docker build -f Dockerfile.worker -t ninaro-worker:v1.0.3 .`
- `docker save -o "C:/Users/Douglas/Desktop/wizer/MVPs/images/ninaro-worker.tar" ninaro-worker:v1.0.3`
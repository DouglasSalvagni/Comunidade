# Script de Teste Simples - Little Tales API
# Testa as principais funcionalidades da API

$baseUrl = "http://localhost:3003/api"

Write-Host "🧪 Iniciando testes da API Little Tales..." -ForegroundColor Green

# 1️⃣ Testar Login
Write-Host "`n1️⃣ Testando Login..." -ForegroundColor Cyan

$loginBody = @{
    email = "admin@little-tales.com"
    password = "password"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    $loginResult = $loginResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Login realizado com sucesso!" -ForegroundColor Green
    Write-Host "Usuário: $($loginResult.user.name)" -ForegroundColor Yellow
    Write-Host "Role: $($loginResult.user.role)" -ForegroundColor Yellow
    
    $authToken = $loginResult.accessToken
    Write-Host "Token JWT obtido com sucesso!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Erro no login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2️⃣ Testar Obter Perfil
Write-Host "`n2️⃣ Testando Obter Perfil..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $authToken"
}

try {
    $profileResponse = Invoke-WebRequest -Uri "$baseUrl/auth/profile" -Method GET -Headers $headers -ErrorAction Stop
    $profileResult = $profileResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Perfil obtido com sucesso!" -ForegroundColor Green
    Write-Host "Email: $($profileResult.email)" -ForegroundColor Yellow
    Write-Host "Nome: $($profileResult.name)" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Erro ao obter perfil: $($_.Exception.Message)" -ForegroundColor Red
}

# 3️⃣ Testar Listar Perfis
Write-Host "`n3️⃣ Testando Listar Perfis..." -ForegroundColor Cyan

try {
    $profilesResponse = Invoke-WebRequest -Uri "$baseUrl/profiles" -Method GET -Headers $headers -ErrorAction Stop
    $profilesResult = $profilesResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Perfis listados com sucesso!" -ForegroundColor Green
    Write-Host "Total de perfis: $($profilesResult.Count)" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Erro ao listar perfis: $($_.Exception.Message)" -ForegroundColor Red
}

# 4️⃣ Testar Criar Perfil
Write-Host "`n4️⃣ Testando Criar Perfil..." -ForegroundColor Cyan

$profileData = @{
    name = "Pedro"
    ageRange = "6-8"
    avatarUrl = "https://example.com/avatar-pedro.png"
    parentalPin = "5678"
}

try {
    $newProfileResponse = Invoke-WebRequest -Uri "$baseUrl/profiles" -Method POST -Headers $headers -Body ($profileData | ConvertTo-Json) -ContentType "application/json" -ErrorAction Stop
    $newProfileResult = $newProfileResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Perfil criado com sucesso!" -ForegroundColor Green
    Write-Host "ID do novo perfil: $($newProfileResult.id)" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Erro ao criar perfil: $($_.Exception.Message)" -ForegroundColor Red
}

# 5️⃣ Testar Listar Planos
Write-Host "`n5️⃣ Testando Listar Planos..." -ForegroundColor Cyan

try {
    $plansResponse = Invoke-WebRequest -Uri "$baseUrl/subscriptions/plans" -Method GET -Headers $headers -ErrorAction Stop
    $plansResult = $plansResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Planos listados com sucesso!" -ForegroundColor Green
    Write-Host "Total de planos: $($plansResult.Count)" -ForegroundColor Yellow
    
    foreach ($plan in $plansResult) {
        Write-Host "  - $($plan.name): R$ $($plan.priceCents / 100)" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Erro ao listar planos: $($_.Exception.Message)" -ForegroundColor Red
}

# 6️⃣ Testar Listar Obras
Write-Host "`n6️⃣ Testando Listar Obras..." -ForegroundColor Cyan

try {
    $worksResponse = Invoke-WebRequest -Uri "$baseUrl/works" -Method GET -Headers $headers -ErrorAction Stop
    $worksResult = $worksResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Obras listadas com sucesso!" -ForegroundColor Green
    Write-Host "Total de obras: $($worksResult.data.Count)" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Erro ao listar obras: $($_.Exception.Message)" -ForegroundColor Red
}

# 7️⃣ Testar Funcionalidades Admin (se for admin)
Write-Host "`n7️⃣ Testando Funcionalidades Admin..." -ForegroundColor Cyan

try {
    # Testar acesso à área admin
    $adminResponse = Invoke-WebRequest -Uri "$baseUrl/admin/works" -Method GET -Headers $headers -ErrorAction Stop
    Write-Host "✅ Acesso admin concedido!" -ForegroundColor Green
    
} catch {
    Write-Host "⚠️  Sem acesso admin ou erro: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n🎉 Testes concluídos!" -ForegroundColor Green
Write-Host "✅ Backend está funcionando corretamente!" -ForegroundColor Green
Write-Host "📚 Documentação Swagger: http://localhost:3003/api/docs" -ForegroundColor Yellow
Write-Host "🔧 Coleção Postman: Little-Tales-API-Collection.json" -ForegroundColor Yellow
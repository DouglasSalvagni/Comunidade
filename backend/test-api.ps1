# Script de Teste Automatizado - Little Tales API
# Este script testa as principais funcionalidades da API

$baseUrl = "http://localhost:3003/api"
$authToken = ""
$profileId = ""
$workId = ""

Write-Host "🧪 Iniciando testes da API Little Tales..." -ForegroundColor Green
Write-Host "Base URL: $baseUrl" -ForegroundColor Yellow

# Função para fazer requisições HTTP
function Invoke-APIRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )
    
    try {
        $url = "$baseUrl$Endpoint"
        $params = @{
            Method = $Method
            Uri = $url
            Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = $Body | ConvertTo-Json
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params -ErrorAction Stop
        return $response.Content | ConvertFrom-Json
    }
    catch {
        Write-Host "❌ Erro na requisição $Method $Endpoint" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $errorBody = $reader.ReadToEnd()
            Write-Host "Detalhes: $errorBody" -ForegroundColor Red
        }
        return $null
    }
}

# 1️⃣ Testar Login
Write-Host "`n1️⃣ Testando Login..." -ForegroundColor Cyan
$loginData = @{
    email = "admin@little-tales.com"
    password = "password"
}

$loginResponse = Invoke-APIRequest -Method "POST" -Endpoint "/auth/login" -Body $loginData
if ($loginResponse) {
    $authToken = $loginResponse.accessToken
    Write-Host "✅ Login realizado com sucesso!" -ForegroundColor Green
    Write-Host "Token JWT obtido: $($authToken.Substring(0, 50))..." -ForegroundColor Yellow
} else {
    Write-Host "❌ Falha no login" -ForegroundColor Red
    exit 1
}

# 2️⃣ Testar Obter Perfil
Write-Host "`n2️⃣ Testando Obter Perfil..." -ForegroundColor Cyan
$headers = @{
    "Authorization" = "Bearer $authToken"
}

$profileResponse = Invoke-APIRequest -Method "GET" -Endpoint "/auth/profile" -Headers $headers
if ($profileResponse) {
    Write-Host "✅ Perfil obtido com sucesso!" -ForegroundColor Green
    Write-Host "Usuário: $($profileResponse.name) ($($profileResponse.email))" -ForegroundColor Yellow
} else {
    Write-Host "❌ Falha ao obter perfil" -ForegroundColor Red
}

# 3️⃣ Testar Listar Perfis
Write-Host "`n3️⃣ Testando Listar Perfis..." -ForegroundColor Cyan
$profilesResponse = Invoke-APIRequest -Method "GET" -Endpoint "/profiles" -Headers $headers
if ($profilesResponse) {
    Write-Host "✅ Perfis listados com sucesso!" -ForegroundColor Green
    Write-Host "Total de perfis: $($profilesResponse.Count)" -ForegroundColor Yellow
    
    if ($profilesResponse.Count -gt 0) {
        $profileId = $profilesResponse[0].id
        Write-Host "ID do primeiro perfil: $profileId" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Falha ao listar perfis" -ForegroundColor Red
}

# 4️⃣ Testar Criar Perfil
Write-Host "`n4️⃣ Testando Criar Perfil..." -ForegroundColor Cyan
$profileData = @{
    name = "Pedro"
    ageRange = "6-8"
    avatarUrl = "https://example.com/avatar-pedro.png"
    parentalPin = "5678"
}

$newProfileResponse = Invoke-APIRequest -Method "POST" -Endpoint "/profiles" -Headers $headers -Body $profileData
if ($newProfileResponse) {
    $profileId = $newProfileResponse.id
    Write-Host "✅ Perfil criado com sucesso!" -ForegroundColor Green
    Write-Host "ID do novo perfil: $profileId" -ForegroundColor Yellow
} else {
    Write-Host "❌ Falha ao criar perfil" -ForegroundColor Red
}

# 5️⃣ Testar Listar Planos
Write-Host "`n5️⃣ Testando Listar Planos..." -ForegroundColor Cyan
$plansResponse = Invoke-APIRequest -Method "GET" -Endpoint "/subscriptions/plans" -Headers $headers
if ($plansResponse) {
    Write-Host "✅ Planos listados com sucesso!" -ForegroundColor Green
    Write-Host "Total de planos: $($plansResponse.Count)" -ForegroundColor Yellow
    
    foreach ($plan in $plansResponse) {
        Write-Host "  - $($plan.name): R$ $($plan.priceCents / 100)" -ForegroundColor White
    }
} else {
    Write-Host "❌ Falha ao listar planos" -ForegroundColor Red
}

# 6️⃣ Testar Listar Obras
Write-Host "`n6️⃣ Testando Listar Obras..." -ForegroundColor Cyan
$worksResponse = Invoke-APIRequest -Method "GET" -Endpoint "/works" -Headers $headers
if ($worksResponse) {
    Write-Host "✅ Obras listadas com sucesso!" -ForegroundColor Green
    Write-Host "Total de obras: $($worksResponse.data.Count)" -ForegroundColor Yellow
    
    if ($worksResponse.data.Count -gt 0) {
        $workId = $worksResponse.data[0].id
        Write-Host "ID da primeira obra: $workId" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Falha ao listar obras" -ForegroundColor Red
}

# 7️⃣ Testar Obter Detalhes da Obra (se houver obras)
if ($workId) {
    Write-Host "`n7️⃣ Testando Obter Detalhes da Obra..." -ForegroundColor Cyan
    $workDetailsResponse = Invoke-APIRequest -Method "GET" -Endpoint "/works/$workId" -Headers $headers
    if ($workDetailsResponse) {
        Write-Host "✅ Detalhes da obra obtidos com sucesso!" -ForegroundColor Green
        Write-Host "Obra: $($workDetailsResponse.title)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Falha ao obter detalhes da obra" -ForegroundColor Red
    }
}

# 8️⃣ Testar Listar Favoritos
Write-Host "`n8️⃣ Testando Listar Favoritos..." -ForegroundColor Cyan
$favoritesResponse = Invoke-APIRequest -Method "GET" -Endpoint "/favorites" -Headers $headers
if ($favoritesResponse) {
    Write-Host "✅ Favoritos listados com sucesso!" -ForegroundColor Green
    Write-Host "Total de favoritos: $($favoritesResponse.Count)" -ForegroundColor Yellow
} else {
    Write-Host "❌ Falha ao listar favoritos" -ForegroundColor Red
}

# 9️⃣ Testar Criar Favorito (se houver obra)
if ($workId) {
    Write-Host "`n9️⃣ Testando Criar Favorito..." -ForegroundColor Cyan
    $favoriteResponse = Invoke-APIRequest -Method "POST" -Endpoint "/works/$workId/favorite" -Headers $headers
    if ($favoriteResponse) {
        Write-Host "✅ Favorito criado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Falha ao criar favorito" -ForegroundColor Red
    }
}

# 🔟 Testar Funcionalidades Admin (se for admin)
if ($profileResponse.role -eq "admin") {
    Write-Host "`n🔟 Testando Funcionalidades Admin..." -ForegroundColor Cyan
    
    # Listar obras para admin
    $adminWorksResponse = Invoke-APIRequest -Method "GET" -Endpoint "/admin/works" -Headers $headers
    if ($adminWorksResponse) {
        Write-Host "✅ Obras do admin listadas com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Falha ao listar obras do admin" -ForegroundColor Red
    }
    
    # Listar usuários para admin
    $adminUsersResponse = Invoke-APIRequest -Method "GET" -Endpoint "/admin/users" -Headers $headers
    if ($adminUsersResponse) {
        Write-Host "✅ Usuários do admin listados com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Falha ao listar usuários do admin" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Testes concluídos!" -ForegroundColor Green
Write-Host "Token JWT válido: $($authToken.Substring(0, 50))..." -ForegroundColor Yellow
if ($profileId) {
    Write-Host "Profile ID: $profileId" -ForegroundColor Yellow
}
if ($workId) {
    Write-Host "Work ID: $workId" -ForegroundColor Yellow
}
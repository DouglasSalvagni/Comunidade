import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';

// Configuração básica para rodar o script
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/little_tales';

const dataSource = new DataSource({
  type: 'postgres',
  url: dbUrl,
  entities: [], // Não precisamos carregar entidades para raw SQL
  synchronize: false,
  ssl: false,
});

async function run() {
  try {
    console.log('Conectando ao banco de dados...');
    await dataSource.initialize();
    
    console.log('Desativando política anterior...');
    await dataSource.query(
      `UPDATE legal_documents SET is_active = false WHERE type = 'PRIVACY_POLICY' AND is_active = true`
    );
    
    const privacyContent = `# Política de Privacidade

## 1. Coleta de Dados
Coletamos informações essenciais para o funcionamento da plataforma, como nome, e-mail e dados de uso (quais músicas são ouvidas).

## 2. Uso das Informações
Utilizamos seus dados para personalizar a experiência, processar pagamentos e garantir a segurança da conta.

## 3. Compartilhamento
Não vendemos seus dados. Compartilhamos apenas com parceiros essenciais (ex: processamento de pagamentos).

## 4. Segurança
Adotamos medidas de segurança para proteger seus dados.

## 5. Seus Direitos
Você pode solicitar acesso, correção ou exclusão de seus dados a qualquer momento.

## 6. Dados de Crianças
Respeitamos a privacidade infantil. Perfis infantis não coletam dados pessoais sensíveis além do nome e idade para recomendação de conteúdo.

## 7. Alterações
Podemos atualizar esta política periodicamente.

## 8. Cookies e Tecnologias de Armazenamento
Utilizamos cookies e tecnologias similares para melhorar sua experiência e lembrar suas preferências.

### Categorias
- **Estritamente Necessários**: Essenciais para autenticação e segurança.
- **Funcionais**: Lembram suas escolhas (ex: perfil ativo, menu). Você pode gerenciar nas preferências.

### Gerenciamento
Você pode alterar suas preferências de cookies no rodapé do site em "Gerenciar Cookies".`;

    console.log('Criando nova política com seção de Cookies...');
    const id = randomUUID();
    
    await dataSource.query(
      `INSERT INTO legal_documents (id, type, content, is_active, created_at) VALUES ($1, $2, $3, $4, NOW())`,
      [id, 'PRIVACY_POLICY', privacyContent, true]
    );
    
    console.log(`Nova política criada com sucesso (ID: ${id}).`);
    
  } catch (error) {
    console.error('Erro ao atualizar documentos:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

run();

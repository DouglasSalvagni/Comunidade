# Resumo do Módulo de Cursos (Conteúdo)

Este módulo foi desenvolvido para suportar a estrutura hierárquica de **Cursos > Módulos > Aulas**, permitindo a criação de trilhas de aprendizado completas com vídeo, texto e materiais de apoio.

## 🚀 Funcionalidades Desenvolvidas

### 1. Estrutura de Conteúdo
- **Cursos**: CRUD completo com título, descrição, thumbnail (R2/S3) e controle de status (Rascunho/Publicado).
- **Módulos**: Organização lógica de aulas dentro de um curso com suporte a reordenação (Drag and Drop).
- **Aulas**: Unidade básica de conteúdo contendo:
  - Título e Ordem.
  - Integração com Vídeo (Upload para R2 e streaming via HLS/MP4).
  - Conteúdo em Texto Rico (Editor Tiptap).
  - Anexos (Materiais de Apoio) para download.

### 2. Gestão de Texto Rico & Anexos (Admin)
- **Editor Tiptap**: Integrado via modal no dashboard administrativo, permite formatação de texto (negrito, links, títulos, listas) que é persistido como HTML no banco de dados.
- **Sistema de Anexos**:
  - Armazenamento em Bucket S3/R2 (prefixo `attachments/`).
  - Upload direto via URL pré-assinada.
  - Registro de metadados (nome, tamanho, tipo) vinculados à aula.
  - Exclusão lógica e física.

### 3. Experiência do Aluno
- **Player de Vídeo**: Suporte a streaming HLS (m3u8) com fallback para MP4.
- **Gestão de Progresso**: Salvamento automático do tempo assistido e marcação de aula concluída.
- **Download de Materiais**: Listagem de anexos com links de download seguro (URL temporária).

---

## 🛠️ Detalhes Técnicos (Para a próxima IA)

### Modificações Importantes
- **Banco de Dados**: Criação da tabela `lesson_attachments` e adição da coluna `conteudo_texto` em `lessons`.
- **Roteamento Backend**: No `courses.controller.ts`, as rotas de `lessons/` devem vir **antes** da rota paramétrica `:id` para evitar conflitos de captura pelo NestJS.
- **Frontend Sync**: O componente `RichTextEditor` utiliza um `useEffect` para sincronizar o estado interno do Tiptap com a prop `value` recebida via API.

---

## ⚠️ Status Atual e Bugs Identificados

Apesar da implementação das funcionalidades, os seguintes pontos foram relatados e precisam de atenção:

1.  **Persistência no Admin**: Ao clicar para editar "Texto & Anexos" em uma aula que já possui conteúdo salvo, o editor de texto rico às vezes não carrega o conteúdo armazenado no banco, aparecendo vazio.
2.  **Interface do Aluno (Dashboard)**:
    - O vídeo não está sendo exibido na página da aula.
    - O texto rico da aula (material de apoio escrito) não aparece.
    - A lista de anexos para download também não é carregada.
    
> **Nota do Desenvolvedor**: Estes problemas podem estar relacionados à ordem das rotas no controller ou ao tempo de carga do editor client-side (Tiptap SSR). Foram feitas tentativas de correção reordenando rotas e adicionando sincronização de estado, mas o comportamento instável persiste conforme relatado pelo usuário.

# Arquitetura de Worker de IA para Chat de Comunidade (NestJS + NextJS)

Este documento descreve a arquitetura de um Worker escalável de IA, baseado no projeto `wizer-agent`, adaptado para um sistema de gestão de comunidades e cursos. O objetivo é que a IA responda dúvidas de alunos com base em uma base de conhecimento (descrições de aulas, transcrições de vídeos e anexos).

## 1. Fluxo de Mensageria (Assíncrono e Escalável)

A principal vantagem desta arquitetura é o uso de filas para desacoplar o recebimento da mensagem do seu processamento pesado pela IA.

### Componentes:
- **Tecnologia**: [BullMQ](https://docs.bullmq.io/) sobre **Redis**.
- **NestJS Module**: Utilizar o `@nestjs/bullmq`.

### Padrão de Debounce (Agrupamento):
Evite chamadas redundantes à IA se o aluno enviar várias mensagens seguidas (ex: "Olá", "Tenho uma dúvida", "Sobre a aula 2").
- Ao receber uma mensagem via API (NestJS), adicione-a a um buffer no Redis (`RPUSH`).
- Agende um Job no BullMQ com um `delay` (ex: 10-15 segundos).
- Se uma nova mensagem chegar para o mesmo aluno antes do Job iniciar, **remova o Job anterior e agende um novo**. Isso garante que a IA processe o bloco completo de mensagens de uma vez.

## 2. Estratégia de RAG (Retrieval Augmented Generation)

Para que a IA responda com precisão sobre o conteúdo do curso, utilize a técnica de RAG com busca vetorial.

### Armazenamento de Conhecimento:
- **Banco de Dados**: PostgreSQL com a extensão `pgvector`.
- **Embeddings**: Gerar vetores usando o modelo `text-embedding-3-small` da OpenAI para cada fragmento de conhecimento (descrição da aula, transcrição do vídeo, conteúdo de PDFs).

### Recuperação de Contexto:
Ao processar uma pergunta:
1. Gere o embedding da pergunta do aluno.
2. Realize uma busca de "Memórias Semânticas" no banco usando o operador `<=>` (cosine distance) do `pgvector`.
3. Filtre pelo `course_id` ou `lesson_id` relevante.
4. Recupere os TOP-K fragmentos mais similares.

## 3. Gestão de Contexto e Memória

A IA precisa "lembrar" do que foi dito anteriormente na conversa.

### Construção do Prompt (Ordem de Importância):
1. **System Prompt**: Defina a personalidade da IA (ex: "Você é um tutor da comunidade X").
2. **Resumo da Conversa (Summary)**: Armazene um resumo atualizado da conversa no banco para economizar tokens de histórico longo.
3. **Memórias Semânticas (RAG)**: Insira os fragmentos recuperados das aulas/anexos.
4. **Histórico Recente**: As últimas 5-10 mensagens trocadas no chat.
5. **Input Atual**: A mensagem (ou bloco de mensagens) que o aluno acabou de enviar.

## 4. Implementação Sugerida (NestJS)

### Estrutura de Tabelas (PostgreSQL):
- `lesson_knowledge`: (id, lesson_id, content, embedding vector(1536)).
- `chat_messages`: (id, user_id, role, content, embedding vector(1536)).
- `chat_summaries`: (user_id, course_id, summary text).

### Lógica do Worker:
```typescript
// Exemplo de lógica no Processor do BullMQ
async process(job: Job) {
  const { userId, text, courseId } = job.data;
  
  // 1. Gerar Embedding da dúvida
  const embedding = await this.openai.embeddings.create(...);
  
  // 2. Busca RAG na base de conhecimento das aulas
  const knowledge = await this.db.query(
    "SELECT content FROM lesson_knowledge WHERE course_id = $1 ORDER BY embedding <=> $2 LIMIT 5",
    [courseId, embedding]
  );
  
  // 3. Buscar Resumo e Histórico
  const summary = await this.getSummary(userId, courseId);
  const history = await this.getRecentHistory(userId);
  
  // 4. Chamada OpenAI (Chat Completion)
  const response = await this.openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "system", content: `Contexto das Aulas: ${knowledge.join('\n')}` },
      { role: "assistant", content: `Resumo anterior: ${summary}` },
      ...history,
      { role: "user", content: text }
    ]
  });
  
  // 5. Salvar resposta e atualizar resumo assincronamente
  await this.saveAndNotify(userId, response);
}
```

## 5. Escalabilidade e Deploy

- **Docker**: Containerize o worker separadamente do backend principal.
- **Concurrency**: Configure o worker para processar múltiplos jobs em paralelo (ex: `concurrency: 20` no BullMQ).
- **Multi-tenancy**: Use o `course_id` ou `community_id` em todas as queries para isolar o conhecimento entre diferentes áreas da aplicação.

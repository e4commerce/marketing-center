# Murano Media Hub

MVP funcional da biblioteca inteligente de mídias da Murano Joias. O produto recebe fotos, vídeos e documentos, cataloga o material com IA via OpenRouter, organiza o Drive novo e permite encontrar ativos por linguagem natural.

## O que já funciona

- interface responsiva para desktop e celular;
- biblioteca em grade ou lista, busca natural e filtros por tipo;
- upload em lote com fila de análise;
- preview, descrição, tags, confiança, edição e reanálise;
- organização automática por confiança e fallback para `90_A_CLASSIFICAR`;
- navegação e criação de pastas;
- central de revisão;
- banco SQLite local e auditoria;
- modo demonstração com acervo inicial;
- OpenRouter server-side com saída JSON estruturada;
- duas conexões OAuth separadas para o Google Drive;
- inventário e importação das duas fontes aprovadas;
- cópia para o Drive novo antes de qualquer organização;
- bloqueios de escrita para IDs pertencentes às fontes;
- lixeira, e não exclusão definitiva, para arquivos do Drive novo;
- proteção opcional por senha.

## Rodar agora

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Sem credenciais, o aplicativo entra automaticamente em modo demonstração.

## Configuração de produção

Preencha no ambiente ou pela tela **Configurações**:

```dotenv
APP_URL=https://seu-dominio
MURANO_ACCESS_PASSWORD=uma-senha-interna-forte
MURANO_SESSION_SECRET=um-segredo-aleatorio-longo
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=openai/gpt-4.1-mini
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_DRIVE_DESTINATION_ROOT_ID=...
MEDIA_HUB_DATA_DIR=/caminho/persistente
```

As chaves inseridas na interface são cifradas com AES-256-GCM e guardadas no diretório de dados. O arquivo `encryption.key` e o banco SQLite precisam de volume persistente e backup protegido.

### Google OAuth

Crie um cliente OAuth do tipo **Web application**, habilite a Google Drive API e cadastre exatamente:

```text
http://localhost:3000/api/hub/drive/callback
https://seu-dominio/api/hub/drive/callback
```

O produto solicita duas autorizações:

- **Destino:** escopo de escrita para criar e organizar o Drive novo.
- **Origem:** escopo somente leitura para inventariar e baixar os materiais aprovados.

Como garantia adicional, a aplicação registra cada ID encontrado nas fontes e rejeita qualquer operação de escrita que tenha um desses IDs como alvo. Todos os arquivos são baixados pela conexão de origem e enviados como novas cópias pela conexão de destino.

As fontes fixas são:

- `164JUiDoPsibeyF1c__lG1Qkyy1rwiRRI`
- `1Vf_SC7Gh5_DD2kzeHs_zM9vT0DTGzvfM`

## Fluxo da carga inicial

1. Configure o Google Client ID e Client Secret.
2. Conecte o **Drive novo da Murano**.
3. Conecte as **pastas de origem**.
4. Informe a raiz existente ou use **Criar estrutura oficial no Drive**.
5. Em **Carga inicial**, execute cada fonte separadamente.
6. Acompanhe a fila pela interface.

O importador cria um inventário antes de copiar, evita repetir itens já importados e nunca move, renomeia, exclui ou substitui conteúdo na origem.

## Análise de IA

Imagens são redimensionadas apenas para a chamada multimodal e enviadas pela API server-side da OpenRouter. O resultado usa JSON Schema estrito e inclui descrições, tags, cores, produtos, contexto, usos sugeridos e confiança.

Sem uma chave OpenRouter, o MVP usa uma heurística local baseada em nome e metadados, identificada claramente no detalhe do ativo.

Para vídeos enviados pela plataforma, o navegador extrai três quadros distribuídos ao longo da duração. Esses quadros viram preview e entram juntos na análise multimodal da OpenRouter, sem depender de `ffmpeg`. Formatos que o navegador do usuário não conseguir decodificar continuam com catalogação básica por nome e metadados. Na carga histórica feita diretamente entre Drives, a extração de quadros pode ser ampliada posteriormente com um worker de vídeo dedicado.

## Segurança e limites atuais

- limite de 200 MB por arquivo e 50 arquivos por lote;
- autenticação por senha interna no MVP; recomenda-se Google Workspace SSO antes de abertura para toda a empresa;
- o SQLite é adequado ao MVP em uma única instância; migre para PostgreSQL antes de escalar horizontalmente;
- uploads locais ficam em `.data/uploads`; com Drive conectado, a cópia oficial fica no Drive novo;
- ações administrativas complexas são melhores no desktop, mas upload, busca, preview e revisão funcionam no celular;
- não há publicação para canais, edição de mídia ou calendário editorial nesta fase.

## Verificação

```bash
npm run typecheck
npm test
npm run build
```

## Estrutura

- `app/` — interface e APIs;
- `components/media-hub.tsx` — experiência principal;
- `server/db.ts` — SQLite, fila, auditoria e dados de demonstração;
- `server/drive.ts` — OAuth, inventário somente leitura e escrita no destino;
- `server/ai.ts` — OpenRouter e heurística local;
- `server/worker.ts` — processamento assíncrono;
- `PRD-Murano-Media-Hub.md` — especificação do produto.

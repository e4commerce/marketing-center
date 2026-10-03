# PRD — Murano Media Hub

**Versão:** 0.2<br>
**Data:** 3 de outubro de 2026<br>
**Status:** Escopo inicial validado; decisões operacionais pendentes<br>
**Responsável de negócio:** Thiago Moura<br>
**Produto:** Plataforma interna de organização e gestão de mídias da Murano Joias

---

## 1. Resumo executivo

O **Murano Media Hub** será a porta de entrada oficial para fotos, vídeos e demais arquivos de marketing da Murano Joias.

A plataforma será integrada ao Google Drive e permitirá que a equipe:

- envie novos arquivos sem precisar organizar pastas manualmente;
- navegue e reorganize a estrutura de pastas do Drive dentro da própria plataforma;
- encontre materiais por linguagem natural, como “foto de mão na água”, “vídeo de colar no verão” ou “imagem em casa com luz natural”;
- receba descrições detalhadas e tags geradas por inteligência artificial;
- escolha entre organização automática, destino manual ou revisão antes do envio;
- mantenha rastreabilidade sobre uploads, análises e movimentações.

O Google Drive será a fonte oficial dos arquivos e de sua hierarquia. A plataforma manterá um índice próprio de metadados para permitir busca rápida, filtros, descrições, tags, histórico e recursos de gestão que o Drive, isoladamente, não oferece.

Todas as análises de IA deverão utilizar modelos acessados por meio da **OpenRouter**. Nenhuma chave ou segredo poderá ser exposto no navegador.

### Decisões confirmadas para o MVP

- A operação começará em um **Google Drive novo da Murano**, criado para ser organizado desde o início pela plataforma.
- A IA poderá mover automaticamente os arquivos dentro desse novo Drive, respeitando regras, confiança mínima, auditoria e possibilidade de correção.
- O acervo inicial virá de duas pastas existentes, usadas exclusivamente como fontes de importação:
  - [Pasta de origem 1](https://drive.google.com/drive/folders/164JUiDoPsibeyF1c__lG1Qkyy1rwiRRI?usp=drive_link)
  - [Pasta de origem 2](https://drive.google.com/drive/folders/1Vf_SC7Gh5_DD2kzeHs_zM9vT0DTGzvfM?usp=drive_link)
- As duas pastas de origem serão tratadas como **somente leitura**. A plataforma não poderá mover, renomear, excluir, substituir nem reorganizar nenhum conteúdo nelas.
- Os materiais serão copiados para o Drive novo; toda análise e organização acontecerá sobre as cópias.
- Usuários autorizados poderão mover e excluir arquivos no Drive novo, conforme perfil e trilha de auditoria.
- O MVP deverá oferecer uma experiência adequada de upload, pesquisa e consulta pelo celular.
- A Murano ainda não possui uma taxonomia oficial; a primeira taxonomia será criada e calibrada a partir do acervo inicial e das correções humanas.

---

## 2. Contexto e problema

O volume de fotos e vídeos da Murano tende a crescer continuamente. Quando cada pessoa envia arquivos diretamente ao Drive, surgem problemas recorrentes:

- nomes de arquivos pouco descritivos;
- pastas duplicadas ou organizadas com critérios diferentes;
- materiais esquecidos ou difíceis de reencontrar;
- perda de tempo procurando um ativo específico;
- dependência da memória de quem produziu ou recebeu o material;
- falta de contexto sobre cenário, produto, estação, campanha e possibilidades de uso;
- risco de criar novas produções mesmo quando já existe um material adequado no acervo.

O problema central não é apenas armazenamento. É transformar um grande volume de mídia em um **acervo compreensível, pesquisável e reutilizável**.

---

## 3. Visão do produto

Criar uma biblioteca inteligente de mídia que concentre o fluxo entre upload, análise, organização, descoberta e reutilização de materiais da Murano.

O produto deve funcionar como uma camada de inteligência e experiência sobre o Google Drive, sem esconder do usuário onde os arquivos realmente estão.

### Princípios do produto

1. **A plataforma é a porta de entrada:** novos materiais devem ser enviados preferencialmente pelo Murano Media Hub.
2. **O Drive continua sendo a fonte dos arquivos:** o sistema não deve criar um repositório paralelo de mídia sem necessidade.
3. **Pastas e tags têm funções diferentes:** pastas representam a organização operacional; tags representam todos os atributos úteis para pesquisa.
4. **A IA sugere; pessoas mantêm o controle:** qualquer classificação automática deve ser editável e reversível.
5. **Busca por intenção, não apenas por nome:** a pessoa deve encontrar um arquivo mesmo sem conhecer seu nome ou sua pasta.
6. **Erros devem ser visíveis:** arquivos não analisados, classificações incertas e falhas de sincronização não podem desaparecer silenciosamente.
7. **Interface limpa:** a complexidade técnica deve ficar em segundo plano e aparecer apenas quando necessária.

---

## 4. Objetivos

### 4.1 Objetivos de negócio

- Reduzir o tempo gasto pela equipe para localizar fotos e vídeos.
- Aumentar o reaproveitamento do acervo já produzido.
- Padronizar a organização de mídias no Google Drive.
- Diminuir duplicidade, perda de contexto e arquivos em locais incorretos.
- Criar a base de dados necessária para futuras funções de marketing com IA.

### 4.2 Objetivos do usuário

- Fazer upload de muitos arquivos com poucos passos.
- Entender onde cada arquivo será salvo.
- Localizar mídias com termos naturais e filtros objetivos.
- Corrigir tags, descrições ou pastas sugeridas pela IA.
- Navegar pelo Drive sem sair da plataforma.
- Visualizar rapidamente o conteúdo antes de baixar ou abrir no Drive.

### 4.3 Indicadores iniciais de sucesso

- Pelo menos 90% dos novos arquivos de marketing enviados pela plataforma após adoção.
- Pelo menos 95% dos uploads concluídos com arquivo no Drive e registro indexado na plataforma.
- Pelo menos 85% dos arquivos analisados automaticamente sem exigir nova tentativa técnica.
- Tempo mediano inferior a 30 segundos para encontrar um ativo conhecido por contexto.
- Taxa de sucesso de busca superior a 80%, medida por abertura, seleção ou download de algum resultado.
- Menos de 10% das sugestões automáticas de pasta corrigidas manualmente após o período inicial de calibração.

As metas deverão ser recalibradas após 30 dias de uso real.

---

## 5. Fora do escopo inicial

O MVP não terá como objetivo:

- substituir Google Drive, Google Workspace ou ferramentas de edição;
- editar foto ou vídeo dentro da plataforma;
- publicar diretamente em Instagram, Meta Ads, TikTok, Klaviyo ou outros canais;
- gerir calendário editorial, aprovação de campanhas ou tarefas de produção;
- gerar novos materiais por IA;
- controlar direitos autorais complexos, contratos de modelos ou licenciamento externo;
- permitir acesso público ao acervo;
- reorganizar automaticamente todo o Drive histórico sem revisão ou configuração inicial.

Esses itens podem ser adicionados em fases futuras.

---

## 6. Usuários e permissões

### 6.1 Perfis

#### Administrador

- conecta e configura a conta do Google Drive;
- define a pasta raiz administrada pela plataforma;
- configura taxonomia, regras de pasta e campos obrigatórios;
- gerencia usuários e permissões;
- visualiza logs, falhas, consumo e fila de processamento;
- pode mover, renomear, arquivar e excluir arquivos conforme a política definida.

#### Gestor de marketing

- faz upload e importação;
- aprova ou corrige sugestões da IA;
- cria e reorganiza pastas;
- edita metadados;
- pesquisa, visualiza, baixa e compartilha links internos;
- acompanha arquivos em revisão ou com erro.

#### Colaborador

- faz upload;
- pesquisa e visualiza o acervo permitido;
- edita os próprios uploads enquanto estiverem em revisão;
- não altera configurações globais nem movimenta pastas protegidas.

#### Consulta

- pesquisa, visualiza e baixa arquivos permitidos;
- não envia, altera ou move conteúdo.

### 6.2 Requisitos de acesso

- Autenticação obrigatória.
- Acesso restrito a usuários autorizados da Murano.
- Permissões verificadas no servidor, e não apenas escondidas na interface.
- Tokens e segredos do Google Drive e da OpenRouter armazenados de forma criptografada ou em cofre de segredos.
- Toda ação sensível deve gerar registro de auditoria.
- Operações de movimentação e exclusão só serão permitidas no Drive novo administrado pela plataforma.
- As credenciais usadas para importar o acervo inicial deverão ter acesso de leitura às pastas de origem, sem permissão de escrita quando isso puder ser garantido pela configuração do Google Drive.

---

## 7. Arquitetura de informação

### 7.1 Navegação principal

1. **Início** — visão rápida do acervo, uploads recentes, pendências e atalhos.
2. **Biblioteca** — grade ou lista com todos os arquivos indexados.
3. **Pastas** — navegação espelhada da pasta raiz no Google Drive.
4. **Enviar** — fluxo de upload em lote.
5. **Revisão** — arquivos com baixa confiança, informação faltante ou erro.
6. **Configurações** — Drive, usuários, taxonomia, IA e regras de organização.

### 7.2 Estrutura de pastas proposta

A estrutura exata deverá ser validada com a equipe. Como padrão inicial:

```text
MURANO_MARKETING/
├── 00_ENTRADA/
├── 01_CAMPANHAS/
│   └── ANO/
│       └── CAMPANHA_OU_PROJETO/
│           ├── FOTOS/
│           ├── VIDEOS/
│           ├── DESIGN/
│           └── OUTROS/
├── 02_EVERGREEN/
│   ├── PRODUTOS/
│   ├── LIFESTYLE/
│   ├── UGC/
│   ├── INSTITUCIONAL/
│   └── BASTIDORES/
├── 03_MATERIAIS_BRUTOS/
├── 04_EXPORTADOS/
├── 90_A_CLASSIFICAR/
└── 99_ARQUIVO/
```

Regras:

- a estrutura não deve criar uma pasta para cada tag;
- um arquivo deve possuir uma única localização oficial, mas pode ter muitas tags;
- arquivos com classificação insegura devem ir para `90_A_CLASSIFICAR` ou aguardar aprovação, conforme a configuração;
- a equipe poderá criar, renomear e mover pastas dentro do limite autorizado;
- pastas reservadas podem ser protegidas contra renomeação ou exclusão.

---

## 8. Escopo funcional do MVP

## 8.1 Integração com Google Drive

### Requisitos

- Conectar o novo Drive da Murano como destino oficial e espaço administrado pela plataforma.
- Selecionar uma pasta raiz específica para o Murano Media Hub.
- Listar a árvore de pastas e os arquivos existentes dentro dessa raiz.
- Criar, renomear e mover pastas pela plataforma.
- Mover e renomear arquivos pela plataforma.
- Fazer upload direto para o Drive por meio da plataforma.
- Abrir o arquivo ou sua pasta diretamente no Google Drive.
- Detectar mudanças feitas diretamente no Drive e refletir essas mudanças no índice local.
- Nunca acessar conteúdo fora da pasta raiz autorizada, salvo nova autorização explícita.
- Conectar separadamente as duas pastas de origem como fontes somente leitura para a carga inicial.
- Copiar os arquivos selecionados das fontes para o Drive novo antes de analisar, renomear ou organizar.
- Registrar a relação entre o identificador do arquivo de origem e o identificador da cópia no Drive novo.
- Bloquear por regra de aplicação qualquer comando de escrita, movimentação ou exclusão direcionado às pastas de origem.

### Regra de isolamento entre origem e destino

As duas pastas existentes não fazem parte da árvore administrada pelo produto. Elas são fontes externas e imutáveis para o fluxo de importação inicial. A plataforma poderá listar e ler seus arquivos, mas todas as mutações deverão apontar exclusivamente para o Drive novo da Murano.

Antes de copiar, o sistema deverá criar um manifesto com os arquivos encontrados, identificadores de origem, nomes, tipos e tamanhos. Depois da cópia, deverá validar a integridade do destino por hash quando disponível ou por uma combinação segura de tamanho, nome e metadados. Falhas de validação não autorizam exclusão ou alteração na origem.

### Regra de consistência

Cada mídia indexada deve manter o identificador permanente do arquivo no Google Drive. Mudanças de nome ou pasta não devem quebrar a ligação entre o arquivo e seus metadados.

### Estados de sincronização

- Sincronizado
- Enviando
- Processando
- Aguardando revisão
- Falha no upload
- Falha na análise
- Arquivo não encontrado no Drive
- Sem permissão

---

## 8.2 Upload de arquivos

### Formas de upload

- arrastar e soltar arquivos;
- selecionar arquivos no computador;
- selecionar uma pasta local, quando suportado pelo navegador;
- escolher um destino manual na árvore do Drive;
- usar a opção “Organizar automaticamente com IA”;
- enviar para a caixa de entrada e classificar depois.

### Comportamento

1. O usuário adiciona um ou vários arquivos.
2. A plataforma valida tipo, tamanho e duplicidade provável.
3. O usuário escolhe organização automática, destino manual ou revisão antes de concluir.
4. O arquivo é enviado ao Drive.
5. A análise de IA acontece em segundo plano.
6. Descrição, tags e sugestão de pasta são gravadas no índice.
7. Se habilitado, a plataforma move o arquivo para a pasta sugerida.
8. O usuário recebe o estado final e pode corrigir os dados.

### Requisitos de experiência

- Upload em lote com progresso por arquivo.
- Possibilidade de continuar usando a plataforma enquanto o processamento ocorre.
- Nova tentativa individual para arquivos com falha.
- Nenhum lote deve ser apresentado como concluído se parte dos arquivos falhou.
- O usuário deve conseguir fechar a tela e consultar o progresso posteriormente.
- Arquivos devem ficar pesquisáveis assim que o índice mínimo estiver disponível, mesmo que a análise detalhada ainda esteja em andamento.
- O fluxo principal de upload deverá funcionar em navegadores móveis, incluindo seleção de fotos e vídeos da galeria ou câmera quando permitido pelo dispositivo.
- No celular, a interface deverá manter progresso visível, permitir retomada ou nova tentativa e evitar perda do lote quando a tela for bloqueada ou o navegador for colocado em segundo plano, dentro das limitações técnicas do sistema operacional.

### Tipos iniciais sugeridos

- Imagem: JPG, JPEG, PNG, WEBP e HEIC, se houver conversão segura para análise e preview.
- Vídeo: MP4, MOV e WEBM.
- Documento e design: PDF e outros formatos somente para armazenamento no MVP; a análise avançada pode vir depois.

Tamanho máximo, duração máxima e formatos finais deverão ser definidos após avaliar o volume real do acervo e os limites da infraestrutura.

---

## 8.3 Análise automática com IA

### Provedor

Todas as chamadas de IA deverão passar pela **OpenRouter**, com o modelo escolhido por configuração de servidor. O produto não deverá depender de um único nome de modelo, para permitir troca por custo, qualidade ou disponibilidade sem alterar a experiência.

### Análise de imagens

Para cada imagem, a IA deverá retornar dados estruturados:

- descrição curta;
- descrição completa em português;
- tipo de conteúdo;
- produtos e categorias visíveis;
- peças ou joias identificáveis;
- ambiente e cenário;
- pessoas, partes do corpo e ações, sem inferir identidade;
- cores predominantes;
- iluminação e estética;
- enquadramento e orientação;
- estação ou contexto sazonal provável;
- ocasiões de uso possíveis;
- campanha ou coleção, apenas quando houver evidência suficiente;
- palavras-chave e sinônimos úteis para busca;
- presença de texto, logotipo ou embalagem;
- possíveis restrições ou alertas visuais;
- pasta sugerida;
- nível de confiança por classificação relevante.

### Análise de vídeos

Para cada vídeo, o sistema deverá:

- coletar metadados técnicos, como duração, proporção e resolução;
- analisar quadros distribuídos ao longo do vídeo;
- identificar mudanças relevantes de cena;
- produzir resumo do vídeo e descrição das cenas;
- reconhecer produtos, cenários, ações, textos e partes do corpo visíveis;
- gerar tags gerais e, futuramente, tags com marcação temporal;
- sugerir pasta e possíveis usos de marketing;
- transcrever fala quando a configuração e o modelo suportarem esse processamento;
- deixar explícito quando a análise não cobriu áudio ou alguma parte do arquivo.

### Regras de segurança e qualidade

- A saída da IA deve obedecer a um esquema estruturado e validado antes de ser salva.
- A IA não pode mover arquivos automaticamente quando a confiança da categoria principal estiver abaixo do limite configurado.
- A IA não deve inventar nome de coleção, campanha, pessoa ou produto.
- Tags com baixa confiança podem ser armazenadas como sugestão, mas não devem virar metadados confirmados sem revisão.
- Descrições e tags devem poder ser editadas por usuários autorizados.
- Correções humanas não devem ser sobrescritas por novas análises sem confirmação.
- O sistema deve guardar versão do modelo, data da análise e status do processamento.

### Exemplo de resultado esperado

```json
{
  "titulo_sugerido": "Mão feminina com anéis dentro da água",
  "descricao_curta": "Close de mão com anéis dourados parcialmente submersa em água clara.",
  "descricao_completa": "Fotografia vertical em close de uma mão usando anéis dourados...",
  "tags": [
    "mão",
    "água",
    "anéis",
    "dourado",
    "verão",
    "lifestyle",
    "close",
    "externo"
  ],
  "orientacao": "vertical",
  "tipo_conteudo": "lifestyle",
  "pasta_sugerida": "02_EVERGREEN/LIFESTYLE/FOTOS",
  "confianca_classificacao": 0.91
}
```

---

## 8.4 Organização automática

### Modos disponíveis

#### Automático

O sistema envia o arquivo, analisa e move para a pasta sugerida quando a confiança ultrapassa o limite configurado.

Este será o modo padrão no Drive novo. Arquivos abaixo do limite de confiança ou sem evidência suficiente irão para `90_A_CLASSIFICAR`, sem impedir que os demais itens do lote sejam organizados.

#### Revisão antes de mover

O arquivo é enviado para `00_ENTRADA`, a IA sugere descrição, tags e destino, e uma pessoa aprova ou altera antes da movimentação.

#### Manual

O usuário escolhe a pasta de destino. A IA ainda pode gerar descrição e tags, sem alterar a localização.

### Critérios de classificação

A sugestão de pasta deve utilizar, em ordem:

1. contexto informado no upload, como campanha, coleção ou projeto;
2. regras fixas configuradas pela Murano;
3. sinais visuais e textuais detectados pela IA;
4. extensão e tipo técnico do arquivo;
5. fallback para pasta de revisão.

Informação explícita fornecida pelo usuário sempre prevalece sobre inferência da IA.

---

## 8.5 Biblioteca e busca

### Busca principal

A busca deve aceitar frases naturais, combinações de atributos e palavras incompletas. Exemplos:

- “foto de mão na água”;
- “vídeo vertical de colar dourado em casa”;
- “conteúdo de verão sem pessoa”;
- “anel em fundo claro para anúncio”;
- “UGC abrindo embalagem”.

### Fontes usadas na busca

- nome do arquivo;
- nome e caminho da pasta;
- descrição curta e completa;
- tags confirmadas e sugeridas;
- produtos, cenário, ação, cor, orientação e estética;
- texto detectado na mídia;
- informações preenchidas no upload;
- similaridade semântica;
- metadados técnicos.

### Filtros

- tipo de arquivo;
- foto ou vídeo;
- orientação: vertical, horizontal ou quadrado;
- campanha, coleção ou projeto;
- tipo de conteúdo;
- produto ou categoria;
- cenário;
- estação ou ocasião;
- cor predominante;
- presença de pessoa;
- data de upload ou criação;
- responsável pelo upload;
- status de análise;
- pasta;
- duração do vídeo;
- resolução mínima.

### Ordenação

- relevância;
- mais recentes;
- mais antigos;
- nome;
- duração;
- maior resolução;
- última atualização.

### Resultados

- grade visual como padrão;
- opção de lista para operação em massa;
- preview rápido sem sair da página;
- destaque dos termos ou atributos que fizeram o arquivo aparecer;
- seleção múltipla;
- ações para abrir no Drive, baixar, copiar link, editar metadados e mover;
- busca sem resultado com sugestões de filtros ou termos alternativos.

---

## 8.6 Visualização e edição do ativo

A página de detalhe deverá mostrar:

- preview da mídia;
- nome atual;
- caminho completo no Drive;
- descrição curta e completa;
- tags;
- produto, cenário, campanha, coleção e demais campos estruturados;
- dimensões, tamanho, formato e duração;
- data de criação e upload;
- autor do upload;
- status da sincronização e da IA;
- nível de confiança das sugestões relevantes;
- histórico de alterações;
- versão e data da análise de IA.

Ações disponíveis conforme permissão:

- editar descrição e tags;
- confirmar ou rejeitar sugestões;
- adicionar ou remover tags;
- mover ou renomear;
- baixar;
- abrir no Drive;
- copiar link;
- solicitar nova análise;
- arquivar;
- excluir, caso a política permita.

---

## 8.7 Gestão de pastas na plataforma

A tela de pastas deverá representar a estrutura real dentro da pasta raiz do Google Drive.

### Operações

- criar pasta;
- renomear pasta;
- mover pasta;
- mover arquivos por arrastar e soltar;
- selecionar vários arquivos e mover em lote;
- enviar diretamente para a pasta aberta;
- ver quantidade de arquivos e pendências por pasta;
- abrir a pasta correspondente no Drive.

### Proteções

- confirmação antes de ações destrutivas;
- alerta sobre impacto ao mover uma pasta com muitos itens;
- prevenção de ciclos e destinos inválidos;
- bloqueio de alterações fora da pasta raiz;
- registro de quem realizou cada ação;
- opção de pastas protegidas;
- preferir arquivamento ou lixeira recuperável à exclusão definitiva.

---

## 8.8 Duplicidade

Antes ou depois do upload, a plataforma deverá verificar:

- arquivo idêntico por hash;
- mesmo nome e tamanho;
- possível duplicidade visual, em fase posterior.

Quando houver duplicidade exata, o usuário poderá:

- cancelar o novo upload;
- manter ambos;
- abrir o arquivo existente;
- substituir somente se a política e sua permissão permitirem.

O sistema nunca deve substituir silenciosamente um arquivo existente.

---

## 8.9 Revisão e tratamento de erros

A central de revisão deverá reunir:

- arquivos com baixa confiança;
- arquivos sem categoria ou destino;
- análises com saída inválida;
- falhas de upload ou sincronização;
- tipos não suportados para análise;
- arquivos removidos ou inacessíveis no Drive;
- possíveis duplicidades;
- correções pendentes.

O usuário poderá resolver itens individualmente ou em lote. Toda falha deve apresentar uma mensagem compreensível e, quando possível, uma ação de correção.

---

## 8.10 Histórico e auditoria

Registrar no mínimo:

- upload;
- análise e reanálise;
- alteração manual de metadados;
- aprovação ou rejeição de sugestão;
- criação, renomeação e movimentação de pasta;
- movimentação, renomeação, arquivamento ou exclusão de arquivo;
- mudança de permissão ou configuração;
- falha relevante de sincronização.

Cada evento deve conter usuário ou processo responsável, data, objeto afetado e valores anteriores e posteriores quando aplicável.

---

## 9. Taxonomia inicial

A taxonomia deverá ser configurável. Proposta inicial:

### Tipo de conteúdo

- Produto
- Lifestyle
- UGC
- Editorial
- Institucional
- Bastidores
- Campanha
- Design
- Embalagem
- Loja ou operação

### Produto ou categoria

- Anel
- Brinco
- Colar
- Pulseira
- Piercing
- Kit ou composição
- Embalagem
- Não identificável

### Cenário

- Casa
- Estúdio
- Praia
- Piscina
- Água
- Rua
- Natureza
- Loja
- Fundo neutro
- Não identificado

### Pessoa ou enquadramento

- Sem pessoa
- Rosto
- Corpo inteiro
- Mão
- Pescoço
- Orelha
- Pulso
- Detalhe de produto
- Múltiplas pessoas

### Estação ou ocasião

- Verão
- Outono
- Inverno
- Primavera
- Festa
- Presente
- Viagem
- Dia a dia
- Data comercial
- Atemporal

### Formato visual

- Vertical
- Horizontal
- Quadrado
- Close
- Plano médio
- Plano aberto
- Fundo transparente
- Com texto
- Sem texto

Tags devem aceitar sinônimos e vocabulário livre, mas os filtros principais devem usar valores normalizados para evitar variações como “mão”, “mãos” e “mao”.

---

## 10. Fluxos principais

### Fluxo A — Upload automático

1. Usuário abre **Enviar**.
2. Arrasta fotos e vídeos.
3. Opcionalmente informa campanha, coleção, projeto ou observação.
4. Seleciona **Organizar automaticamente**.
5. A plataforma envia os arquivos e mostra o progresso.
6. A IA analisa cada item e retorna metadados estruturados.
7. Arquivos com alta confiança são movidos para o destino previsto.
8. Arquivos incertos são direcionados à revisão.
9. O usuário recebe um resumo: concluídos, em revisão e com erro.

### Fluxo B — Upload em pasta manual

1. Usuário navega até uma pasta.
2. Seleciona **Enviar aqui**.
3. Adiciona os arquivos.
4. A plataforma envia para essa pasta.
5. A IA descreve e cria tags, mas não muda o destino.

### Fluxo C — Busca por linguagem natural

1. Editor pesquisa “foto de mão na água”.
2. O sistema combina busca textual, filtros e semântica.
3. Resultados aparecem por relevância.
4. O editor abre um preview e entende por que o resultado corresponde à busca.
5. O editor baixa, copia o link ou abre o arquivo no Drive.

### Fluxo D — Reorganização

1. Gestor abre **Pastas**.
2. Move um arquivo ou pasta.
3. A plataforma valida permissão e destino.
4. A alteração é feita no Drive.
5. O índice e o histórico são atualizados.
6. Em caso de falha, a interface mantém o estado anterior e informa o motivo.

### Fluxo E — Carga inicial a partir das duas pastas de origem

1. O administrador conecta o Drive novo da Murano como destino administrado.
2. A plataforma recebe acesso de leitura às duas pastas de origem aprovadas.
3. O sistema cria um inventário dos arquivos sem mover, renomear, excluir ou editar nenhum item na origem.
4. Antes de executar, apresenta quantidade de arquivos, volume, formatos, possíveis duplicidades e estimativa de processamento.
5. O administrador inicia a importação por lote.
6. Cada arquivo é copiado para uma área temporária controlada no Drive novo.
7. A plataforma valida a cópia e registra os identificadores de origem e destino.
8. A IA analisa a cópia, cria descrições e tags e define seu destino dentro do Drive novo.
9. A cópia é movida automaticamente no Drive novo quando atingir a confiança mínima; caso contrário, vai para `90_A_CLASSIFICAR`.
10. Um relatório final informa copiados, organizados, duplicados, pendentes e com erro.
11. Nenhuma etapa do fluxo modifica as duas pastas de origem.

---

## 11. Requisitos não funcionais

### Desempenho

- A biblioteca deve carregar progressivamente, com paginação ou carregamento incremental.
- A busca deve responder, como meta inicial, em até 2 segundos para consultas comuns após indexação.
- O upload deve ser retomável ou tolerante a falhas para arquivos grandes, quando tecnicamente viável.
- Análise de IA e geração de previews devem acontecer em filas assíncronas.

### Confiabilidade

- Operações entre banco e Drive devem ser idempotentes sempre que possível.
- Repetir uma tarefa não deve criar arquivos ou movimentações duplicadas.
- Webhooks, sincronização incremental ou rotina periódica devem reconciliar alterações externas.
- A plataforma deve manter fila de nova tentativa e fila de falhas definitivas.

### Segurança e privacidade

- Conexões protegidas por HTTPS.
- Princípio do menor privilégio no Google Drive.
- Chaves disponíveis somente no servidor.
- Validação de tipo real do arquivo, não apenas da extensão.
- Proteção contra upload de conteúdo executável ou malicioso.
- URLs temporárias ou acesso autenticado para previews quando necessário.
- Registro de acesso e alterações sensíveis.
- Política definida de retenção para arquivos temporários usados na análise.
- Separação explícita entre permissões de leitura nas fontes e permissões de escrita no Drive novo.
- Validação no servidor para impedir mutações em qualquer identificador pertencente às pastas de origem ou aos seus descendentes.
- Testes automatizados garantindo que importação, nova tentativa e tratamento de erro nunca executem operações de escrita nas fontes.

### Responsividade e uso móvel

- Upload, busca, preview, filtros essenciais e acompanhamento de processamento devem funcionar no celular desde o MVP.
- Ações destrutivas ou movimentações em lote devem exigir confirmação especialmente clara em telas pequenas.
- A grade deve adaptar quantidade de colunas e densidade sem esconder o status de processamento.
- Vídeos e imagens devem usar previews otimizados para reduzir consumo de dados móveis.
- Recursos administrativos complexos podem priorizar desktop, desde que as operações essenciais continuem acessíveis pelo celular.

### Acessibilidade

- Navegação por teclado.
- Estados de foco visíveis.
- Contraste adequado.
- Rótulos acessíveis em ícones e controles.
- Não depender apenas de cor para indicar status.

### Observabilidade

- volume de uploads;
- taxa e tempo de processamento;
- consumo estimado de IA por arquivo e período;
- falhas por integração, modelo e formato;
- divergências entre índice e Drive;
- fila pendente e tempo de espera;
- taxa de correção humana da classificação.

---

## 12. Direção de design

### Referência visual

Design inspirado no **Intercom White**: leve, editorial, com grande uso de branco, cinzas suaves, tipografia clara, bordas discretas, hierarquia forte e ações contextuais.

### Princípios visuais

- interface minimalista, moderna e silenciosa;
- conteúdo visual como protagonista;
- poucos elementos competindo pela atenção;
- cor de destaque usada com moderação;
- cards com cantos suaves e sombras mínimas;
- barra de busca central e evidente;
- filtros simples, recolhíveis e fáceis de remover;
- feedback de estado imediato, sem excesso de modais;
- densidade ajustável entre grade confortável e lista operacional.

### Componentes principais

- barra lateral compacta;
- busca global;
- cards de mídia com preview, tipo, duração e status;
- árvore de pastas;
- painel lateral de detalhe;
- área de upload com arrastar e soltar;
- chips de tags;
- filtros combináveis;
- barra de ações em lote;
- indicadores discretos de processamento e erro;
- central de revisão.

---

## 13. Modelo conceitual de dados

### Usuário

- id
- nome
- e-mail
- função
- status

### Arquivo de mídia

- id interno
- id permanente do Google Drive
- nome
- extensão e MIME type
- tamanho
- hash
- pasta atual
- URL do Drive
- dimensões, duração e orientação
- data do arquivo, upload e atualização
- usuário responsável
- status de upload, sincronização e análise

### Metadados de IA

- título sugerido
- descrição curta
- descrição completa
- campos estruturados
- tags sugeridas
- tags confirmadas
- confiança por campo
- modelo e versão da análise
- prompt ou versão da regra
- data da análise

### Pasta

- id do Google Drive
- nome
- pasta pai
- caminho calculado
- proteção e regras aplicáveis

### Trabalho assíncrono

- tipo
- status
- tentativas
- erro
- custo estimado ou registrado
- início e conclusão

### Evento de auditoria

- usuário ou serviço
- ação
- objeto
- antes e depois
- data
- origem

---

## 14. Arquitetura funcional recomendada

```text
Interface web
    │
    ├── API da plataforma
    │     ├── Autenticação e permissões
    │     ├── Catálogo e busca
    │     ├── Gestão de pastas
    │     └── Uploads e auditoria
    │
    ├── Google Drive API ── arquivos e hierarquia oficial
    │
    ├── Banco de dados ── metadados, índice, histórico e configurações
    │
    ├── Fila de processamento
    │     ├── previews e metadados técnicos
    │     ├── análise de imagem ou vídeo
    │     └── sincronização e novas tentativas
    │
    └── OpenRouter ── modelos multimodais e recursos de IA
```

### Decisões recomendadas

- O navegador nunca se comunica diretamente com a OpenRouter usando credenciais permanentes.
- Arquivos temporários para análise devem ser eliminados conforme política curta de retenção.
- A pasta raiz e regras de organização devem ser configuráveis.
- O nome do modelo de IA deve ser variável de ambiente ou configuração administrativa.
- A busca deve combinar filtros determinísticos, texto completo e similaridade semântica.
- O processamento de vídeo deve usar amostragem inteligente para controlar custo e latência.

---

## 15. Métricas de produto e operação

### Adoção

- usuários ativos por semana;
- uploads por usuário e equipe;
- proporção de novos arquivos enviados pela plataforma;
- quantidade de buscas e arquivos reutilizados.

### Busca

- buscas com resultado;
- buscas seguidas de abertura, download ou cópia de link;
- termos sem resultado;
- posição média do item escolhido;
- tempo entre busca e seleção.

### Qualidade da IA

- percentual de arquivos analisados;
- taxa de correção de descrição, tags e destino;
- taxa de baixa confiança;
- reanálises solicitadas;
- divergência entre sugestão e decisão humana.

### Operação

- tempo de upload e processamento;
- falhas por tipo;
- custo de IA por imagem, vídeo e mês;
- tamanho do acervo;
- divergências de sincronização;
- duplicidades evitadas.

---

## 16. Fases de entrega

### Fase 0 — Descoberta e preparação

- criar e configurar o novo Drive da Murano;
- inventariar, sem alterar, as duas pastas de origem aprovadas;
- propor a primeira taxonomia a partir de uma amostra representativa do acervo;
- validar a estrutura oficial de pastas do Drive novo;
- definir perfis de acesso;
- definir política de exclusão, retenção e arquivo;
- estimar custo da cópia e análise do acervo inicial;
- selecionar modelo inicial da OpenRouter por teste comparativo.

### Fase 1 — MVP operacional

- autenticação e permissões;
- conexão com uma pasta raiz do Drive;
- importação protegida e somente leitura das duas pastas de origem;
- navegação por pastas;
- upload em lote;
- destino manual e automático;
- análise de imagens;
- análise básica de vídeos por quadros;
- descrição, tags e classificação;
- biblioteca, filtros e busca;
- edição manual;
- revisão de baixa confiança e erros;
- histórico básico;
- experiência móvel para upload, busca, preview e acompanhamento.

### Fase 2 — Escala e inteligência

- expansão da importação para outras fontes aprovadas;
- busca semântica avançada;
- transcrição e busca por falas de vídeo;
- tags por cena e marcação temporal;
- duplicidade visual;
- ações em lote avançadas;
- regras de automação configuráveis;
- dashboards de adoção, custo e qualidade.

### Fase 3 — Operação de marketing

- coleções temporárias e pastas de seleção;
- favoritos e compartilhamento interno;
- aprovação de ativos;
- vínculo com briefing, campanha e calendário;
- integrações com ferramentas de criação e publicação;
- recomendações de mídia para um briefing.

---

## 17. Critérios de aceite do MVP

O MVP será considerado funcional quando:

1. Um usuário autorizado conseguir enviar fotos e vídeos em lote.
2. Cada arquivo concluído existir no Google Drive e possuir registro correspondente na plataforma.
3. O usuário puder escolher entre destino manual, revisão e organização automática.
4. Imagens receberem descrição detalhada, tags estruturadas e sugestão de pasta por IA via OpenRouter.
5. Vídeos receberem ao menos resumo e tags por análise visual de quadros.
6. Um editor encontrar um ativo adequado pesquisando uma descrição natural como “mão na água”, sem conhecer o nome do arquivo.
7. A árvore de pastas mostrada na plataforma refletir a pasta raiz do Drive.
8. Usuários autorizados conseguirem criar, renomear e mover pastas e arquivos pela plataforma.
9. Correções manuais prevalecerem sobre sugestões futuras da IA.
10. Falhas, baixa confiança e arquivos não processados aparecerem na central de revisão.
11. Nenhuma chave de OpenRouter ou token permanente do Drive ficar disponível no cliente.
12. Ações sensíveis forem validadas no servidor e registradas em histórico.
13. Alterações feitas diretamente no Drive forem reconciliadas com a plataforma.
14. O usuário conseguir abrir o arquivo no Drive e baixar ou copiar seu link conforme sua permissão.
15. Upload, busca, preview e acompanhamento de processamento funcionarem adequadamente no celular e no desktop.
16. A carga inicial copiar os materiais das duas fontes para o Drive novo, mantendo um registro verificável entre origem e cópia.
17. Nenhuma operação da plataforma mover, renomear, excluir, substituir ou reorganizar arquivos e pastas nas duas fontes originais.
18. Arquivos importados serem analisados e organizados somente depois de existirem como cópias validadas no Drive novo.

---

## 18. Riscos e mitigação

### Classificação incorreta pela IA

**Risco:** arquivos são movidos para pastas erradas ou recebem informações inventadas.

**Mitigação:** confiança mínima, revisão, esquema estruturado, taxonomia fechada para campos críticos e histórico reversível.

### Explosão de pastas

**Risco:** transformar cada tag em uma pasta torna o Drive novamente difícil de navegar.

**Mitigação:** estrutura de pastas curta e estável; atributos detalhados permanecem como tags.

### Custo elevado de vídeo

**Risco:** análise quadro a quadro é cara e lenta.

**Mitigação:** amostragem, detecção de cenas, limites configuráveis, estimativa prévia e fila.

### Divergência entre plataforma e Drive

**Risco:** usuários movem ou removem itens diretamente no Drive.

**Mitigação:** identificadores permanentes, sincronização incremental, reconciliação periódica e status visível.

### Dependência de fornecedor

**Risco:** modelo muda de preço, qualidade ou disponibilidade.

**Mitigação:** acesso centralizado pela OpenRouter, modelo configurável, resultados estruturados e testes de regressão.

### Adoção parcial

**Risco:** parte da equipe continua usando apenas o Drive.

**Mitigação:** experiência de upload mais simples do que no Drive, treinamento curto e detecção de mudanças externas.

### Alteração acidental das pastas de origem

**Risco:** um erro de integração tenta mover, renomear ou excluir conteúdo usado como fonte.

**Mitigação:** acesso somente leitura sempre que possível, bloqueio de mutações no servidor, manifesto prévio, testes automatizados e organização realizada exclusivamente sobre as cópias no Drive novo.

---

## 19. Decisões pendentes para fechar a versão 1.0

1. O Drive novo será uma unidade compartilhada da empresa ou pertencerá a uma conta operacional específica?
2. Quais pessoas entrarão no MVP e qual será o perfil de cada uma?
3. A exclusão no Drive novo deverá sempre enviar para a lixeira ou administradores poderão excluir definitivamente?
4. Quais formatos, tamanhos e durações de vídeo são comuns na operação real?
5. A plataforma deve separar arquivos brutos, editados e exportados como regra obrigatória?
6. Há necessidade de registrar direitos de uso, modelo, fotógrafo, validade ou restrição de publicação?
7. Qual volume aproximado existe em cada uma das duas pastas de origem?
8. Após a importação inicial, as fontes continuarão sincronizadas para copiar novos itens ou serão usadas uma única vez?

---

## 20. Recomendação de recorte inicial

Para reduzir risco e gerar valor rápido, o primeiro lançamento deve começar com:

- um Drive novo e uma única pasta raiz administrada;
- um grupo pequeno de usuários de marketing;
- upload de JPG, PNG, WEBP, MP4 e MOV;
- organização automática como modo padrão, com confiança mínima e fallback para `90_A_CLASSIFICAR`;
- análise de imagem completa e análise básica de vídeo;
- taxonomia inicial gerada a partir de amostra real e limitada aos campos mais úteis para busca;
- biblioteca, busca natural, filtros e edição de metadados;
- movimentação manual de arquivos e pastas dentro da plataforma;
- upload, busca e consulta bem resolvidos no celular;
- importação em lotes das duas pastas aprovadas, sempre copiando para o Drive novo e preservando as origens integralmente.

Nas primeiras duas a quatro semanas, as correções humanas devem calibrar taxonomia, confiança mínima e regras de destino. A movimentação automática continuará ativa, mas classificações incertas permanecerão isoladas em `90_A_CLASSIFICAR`.

# Guia de transferência — fluxo de edição dos vídeos de Gabriel

**Cliente/editor:** Matheus Santos  
**Atualizado em:** 25 de novembro de 2026  
**Objetivo:** permitir que outro assistente continue as edições sem repetir os erros já corrigidos pelo Matheus.

Este documento registra pedidos explícitos, decisões por projeto e implementações técnicas. Não transforma um ajuste de um vídeo em regra universal. Onde não existe um valor fixado pelo Matheus, isso está indicado. Os exemplos de comandos são reproduzíveis, mas os caminhos precisam ser adaptados ao computador e aos discos disponíveis.

## 0. Leia isto antes de começar

As prioridades são, nesta ordem:

1. Cumprir a instrução mais recente do Matheus para aquele vídeo.
2. Usar o trecho certo da fala e a ação certa da imagem.
3. Escolher partes naturalmente estáveis da captação. **Não aplicar estabilizador para tentar salvar um trecho ruim.**
4. Manter Gabriel andando e gesticulando em velocidade natural.
5. Manter a voz inteligível; música e efeitos devem participar sem encobri-la.
6. Se houver legendas, usar texto limpo, sombra suave e **nenhum contorno preto**.
7. Quando houver efeitos sonoros, procurar primeiro na biblioteca do Matheus: `/Volumes/MATZU/GERAL/SFX`.
8. Fazer uma revisão visual real antes da entrega. Não confiar apenas em transcrição, nomes de clipes ou números de segundos.
9. Corrigir precisamente os pontos indicados, sem remontar o restante desnecessariamente.
10. Economizar tempo e créditos: reaproveitar material já analisado, fazer verificações direcionadas e não renderizar tudo novamente para uma alteração só de áudio.

**Três distinções essenciais:**

- “Take mais estabilizado” significa selecionar um trecho com câmera mais firme; não significa usar um efeito de estabilização.
- “Dinâmico” significa boa escolha de planos, cortes, texto e som; não significa acelerar Gabriel andando.
- “Sem música” ou “só a voz” não significa exportar mudo. A fala deve permanecer.

## 1. Visão geral do trabalho

### 1.1. Tipos de vídeo

Gabriel representa lojas e marcas. Os trabalhos desta conversa incluem visitas a lojas, apresentação de espaços, mobiliário, luminárias, ambientes e promoção de roupas. O mesmo padrão pode ser aplicado a outra loja, respeitando o material daquela gravação.

Há três famílias principais:

| Família | Estrutura | Fala | Exemplos |
| --- | --- | --- | --- |
| Passeio visual pela loja | Entrada, interação com produtos, detalhes, percurso e encerramento visual | Pode não ter nenhuma fala | Belas Artes 1 e Elmax 01 |
| Apresentação com off | Introdução falada, imagens de apoio sobre voice-over, encerramento falado | A fala conduz a montagem | Belas Artes 2, Elmax 02 e Studio Arko |
| Promocional | Gancho, apresentação das condições, imagens que demonstram cada benefício, fechamento | Geralmente fala ou off com trilha e efeitos | Taubaté Conceito / look da festa |

### 1.2. Plataforma e público

- Uso principal observado: Instagram, especialmente Reels, com capa e legenda de publicação quando solicitadas.
- Os vídeos de lojas representadas por Gabriel se dirigem ao público dessas lojas. Não foi definida uma persona demográfica única, idade ou gênero obrigatório.
- Studio Arko: o próprio roteiro se dirige a arquitetos, seus clientes, parceiros e oportunidades de negócios.
- Lojas de iluminação, móveis e ambientes: pessoas interessadas na loja e nos produtos; profissionais de arquitetura podem ser relevantes conforme a fala.
- Taubaté Conceito: público interessado em montar o look da festa e aproveitar descontos.

### 1.3. Formatos

- Vertical: **9:16**, com entregas finais verificadas em **1080 × 1920**.
- Horizontal: **16:9**, com entregas finais verificadas em **1920 × 1080**.
- No Studio Arko o Matheus pediu explicitamente os dois formatos.
- Não presumir que todo vídeo precisa de uma versão horizontal. A exigência dos dois formatos é confirmada para Arko; para outros projetos, seguir o pedido correspondente.
- Na adaptação de proporção, manter Gabriel bem enquadrado, preferencialmente centralizado quando a composição pedir isso. A legenda pode ocupar o espaço livre ao lado dele.
- Não esticar a imagem para preencher a tela.

### 1.4. Duração real dos exemplos finais

Metadados lidos dos arquivos locais em 25/11/2026:

| Arquivo/versão | Duração | Resolução |
| --- | ---: | --- |
| Studio Arko — Vertical — Só voz | 30,46 s | 1080 × 1920 |
| Studio Arko — Horizontal — Só voz | 30,46 s | 1920 × 1080 |
| Taubaté Conceito — Nova trilha e caixa registradora | 21,25 s | 1080 × 1920 |
| Elmax 01 — Revisão dos trechos indicados | 30,00 s | 1080 × 1920 |
| Elmax 02 — Sem legendas — Só voz | 24,60 s | 1080 × 1920 |

Uma referência prática para esses vídeos é aproximadamente **20 a 35 segundos**, e não uma duração obrigatória para todos os projetos. O Matheus pediu cerca de 30 segundos para Elmax 01 porque faltavam imagens de luminárias e detalhes.

## 2. Estilo de edição

### 2.1. Ritmo e cortes

- A edição precisa ser dinâmica, organizada e coerente com a fala.
- Usar os melhores intervalos dentro de cada arquivo, e não simplesmente o início de cada take.
- A ação deve estar efetivamente acontecendo: entrar, olhar, aproximar peças, escolher um tênis, passar pelo ambiente, embalar e fechar a caixa.
- Os planos não precisam ter todos a mesma duração. Não existe uma regra estabelecida de cortar a cada segundo ou a cada batida.
- O Matheus autorizou deixar um pequeno espaço na sequência para a caminhada ficar natural antes de começar outra frase. Isso é preferível a comprimir a entrada acelerando a pessoa.
- Cortar no ritmo da mensagem, usando a trilha como apoio. A música não deve impor cortes que prejudiquem a ação.
- Em promoções, dar presença aos benefícios e às porcentagens. O desconto não deve receber o mesmo tratamento visual de uma palavra sem importância.

### 2.2. Silêncios, respirações, erros e repetições

- Retirar tentativas malsucedidas, conversa de bastidor, engasgos, falsos começos e repetições de uma mesma frase.
- Procurar a versão em que a pessoa conclui a frase sem travar.
- Não assumir que a primeira tentativa é a melhor. No promocional de roupas, o Matheus avisou que a última fala do final era a que deveria entrar.
- Preservar pausas que ajudem a compreensão e a naturalidade.
- Não existe uma preferência explícita por remover todas as respirações. Não transformar a fala em uma sequência sem ar.
- Não cortar consoantes de entrada, finais de palavras, sibilantes ou a sustentação de “desconto”, “juros” etc.
- Depois de encurtar a fala, sincronizar novamente imagens, legendas e efeitos.

**Exemplo de escolha textual:** na campanha da festa, o áudio começava com “a Collabs tá chegando”. O Matheus autorizou retirar esse trecho e começar diretamente em **“E aí, o look da festa já está pronto?”**. Essa autorização pertence àquela gravação; não é um gancho genérico para outros trabalhos.

### 2.3. Continuidade: quando não fazer corte

No Elmax 01, a abertura era um movimento único: a câmera mostrava a logo/fachada e se direcionava ao Gabriel entrando na loja. O assistente cortou esse movimento e o Matheus rejeitou.

O correto é:

1. Manter o movimento contínuo da câmera.
2. Deixar a identificação da loja aparecer brevemente.
3. Acompanhar a câmera chegando ao Gabriel.
4. Só então seguir para os próximos planos.

Ele comentou que uma identificação parada por dois segundos estava demorando e poderia ocupar aproximadamente um segundo. Isso não autoriza quebrar a tomada contínua nem acelerar a caminhada.

### 2.4. Estabilidade: a regra que mais gerou retrabalho

**Não usar estabilização artificial.** O Matheus foi explícito e repetiu isso em diferentes vídeos.

O que selecionar:

- Trechos depois de o operador terminar de ajeitar a câmera.
- Deslocamentos suaves, sem arrancada ou freada brusca.
- Panorâmicas e movimentos de luminárias quando já estão assentados.
- Gabriel efetivamente caminhando, com a câmera acompanhando de maneira natural.
- Final de plano antes de a câmera começar a descer ou perder o objeto.

O que excluir:

- Preparação para andar, ajeitada inicial, reposicionamento brusco.
- Partes em que a câmera sobe ou desce sem contribuir para mostrar o produto.
- Trechos em que Gabriel ainda está se posicionando ou olhando sem executar a ação necessária.
- Fim de tomada com câmera caindo ou inclinando para baixo.

No Elmax 01 o Matheus apontou especificamente problemas por volta de **6–7 s, 12 s, 15–16 s e 25 s** de uma versão. Esses números são pontos de revisão daquela versão, não timecodes obrigatórios para novas montagens.

Não responder ao problema selecionando de novo o mesmo intervalo. É preciso comparar o trecho substituído e confirmar visualmente que o problema sumiu.

### 2.5. Velocidade

- Caminhada de Gabriel deve ficar na velocidade em que foi gravada.
- O Matheus percebeu uma abertura que parecia perto de 2× e pediu para corrigir.
- Ele também questionou aceleração de Gabriel andando dentro da loja.
- Não usar `setpts=0.5*PTS` ou outro speed-up em pessoas andando para fazer a sequência caber.
- Se precisar ganhar tempo, selecionar menos imagens, encurtar as pausas adequadas ou reorganizar a sequência.
- Não há autorização geral para câmera lenta, speed ramps ou interpolação de movimento.

### 2.6. Zooms e enquadramento

- Zoom e recorte foram necessários para adaptar materiais entre 9:16 e 16:9.
- Prioridade: preservar Gabriel, rosto, mãos e o produto que sustenta a fala.
- Não há um valor universal de zoom aprovado para os vídeos de Gabriel.
- Pequenas diferenças de enquadramento podem ajudar a pontuar um corte, mas devem parecer deliberadas e não cortar a ação.
- Não confundir um pedido de adaptação de proporção com autorização para dar zoom o tempo todo.
- Na escolha de duas peças, as duas precisam aparecer. No look completo, preservar roupa e tênis relevantes ao gesto.

### 2.7. Transições

- Cortes diretos e limpos são a base.
- Usar efeitos quando tenham função na ação ou no benefício anunciado.
- Não foi estabelecido um padrão de transições chamativas em todos os vídeos.
- A passagem entre ambientes pode seguir o movimento e a narração, como no Studio Arko.
- Em uma campanha posterior da Constru-Tech, o Matheus pediu um corte curto com clique e uma “piscada” entre ofertas. É uma técnica transferível para uma promoção semelhante, não uma exigência para Elmax ou Arko.

## 3. Montagem de acordo com a fala

### 3.1. Studio Arko

**Grafia definitiva: Studio Arko.** O Matheus corrigiu primeiro oralmente e depois escreveu “Arko”. Nomes antigos de arquivo ainda contêm “Arco”; isso não torna a grafia correta.

Estrutura pedida:

1. Gabriel se dirige ao arquiteto.
2. Gabriel apresenta: “Esse é o Studio Arko!”.
3. Entra a voz em off, acompanhada por recortes dos diferentes ambientes.
4. Ao terminar o off, volta a fala final de Gabriel.

O roteiro fornecido pelo Matheus para corrigir a transcrição é:

> **Cena 1 — Gancho:** “Arquiteto, imagine ter um espaço pensado para conectar você, seus clientes e novas oportunidades.”
>
> **Cena 2 — Apresentação:** “Esse é o Studio Arko! Um ambiente criado para ir além de um simples espaço de trabalho.”
>
> **Cena 3 — O que oferece:** “Aqui, você encontra estrutura para receber seus clientes, conteúdo técnico, coworking e eventos.”
>
> **Cena 4 — Propósito:** “Tudo isso em um só lugar, para criar conexões, fortalecer parcerias e gerar novos negócios.”
>
> **Cena 5 — Encerramento:** “Studio Arko. Onde conexões se transformam em oportunidades.”

Usar esse texto como base para nomes e palavras, conferindo o que está efetivamente no áudio selecionado. Não gerar uma voz nova para completar diferenças de roteiro.

**Última direção de áudio:** sem música; deixar apenas a voz porque o Matheus faria o tratamento e escolheria a trilha depois.

### 3.2. Taubaté Conceito — promoção / look da festa

Fontes indicadas pelo Matheus: intervalo de **C8464 a C8480**, no SSD que na ocasião se chamava `Untitled`. Off principal indicado: **C8477**.

Sequência desejada:

| Momento da mensagem | Imagem correspondente |
| --- | --- |
| Abertura | Gabriel em frente à loja, cumprimentando o rapaz e entrando |
| Escolha de uma peça | Gabriel mostrando uma peça |
| Escolha de duas peças | Gabriel olhando para as duas peças e aproximando-as da câmera |
| Montar o look completo | Gabriel com o tênis na mão, olhando a roupa e o calçado |
| Fechamento | Embalagem, peças sendo colocadas na caixa e encerramento |

**Correções específicas:**

- Não usar o momento em que ele apenas sorri segurando peças se a fala pede que ele olhe e aproxime as duas.
- A parte correta estava mais para o fim do take. Procurar dentro do arquivo.
- Não inserir uma cena de tênis aleatoriamente no meio da fala das duas peças.
- O tênis entra no benefício do look completo.
- Preservar os dois primeiros planos em velocidade natural.
- Usar a última tentativa válida do encerramento.
- Dar destaque maior às porcentagens na legenda.
- Música promocional, efeitos e caixa registradora; mixar com voz clara.

Os descontos daquela gravação devem ser confirmados no off. Não copiar taxas da Constru-Tech nem inventar valores com base neste guia.

### 3.3. Belas Artes 1 e Belas Artes 2: os dois modelos

O Matheus explicou que usa esse padrão nas lojas que Gabriel representa:

- **Belas Artes 1:** movimento de Gabriel entrando, passando a mão nos móveis e interagindo com a loja. Não tem fala; é conduzido por música.
- **Belas Artes 2:** introdução falada, imagens de apoio e finalização falada.

Ao pedir dois vídeos de outra loja “na mesma pegada”, produzir essas duas estruturas diferentes. Não fazer duas versões praticamente iguais.

### 3.4. Elmax

O Matheus indicou os arquivos **C8453 a C8463**. Em fala espontânea, citou nomes como “C84560” e “C84561”; a leitura operacional do intervalo foi **C8460** e **C8461**, mas o próximo assistente deve conferir os nomes reais no disco antes de selecionar.

- C8457, C8458, C8459 e C8460: tentativas com erros; identificar a fala correta. O Matheus acreditava que poderia ser C8460, sem garantir.
- C8461: off indicado.
- C8454 e C8455: várias luminárias e cenas diferentes dentro dos mesmos arquivos. Fazer uma mescla; não usar só uma parte de cada arquivo.

**Elmax 01 — passeio visual:**

- Música mais animada. O Matheus rejeitou uma trilha que chamou de “música de funerária”.
- Abertura contínua de logo/fachada para Gabriel entrando.
- Substituir entrada ou caminhada instável por outro intervalo realmente mais suave.
- Mostrar mais luminárias e ambientes, chegando a aproximadamente 30 s.
- No final, mostrar Gabriel passando/caminhando, e não apenas se preparando para começar.
- Não deixar o fim da tomada em que a câmera desce.
- Após a última revisão dos trechos instáveis, o Matheus disse: “Agora sim, ficou excelente”.

**Elmax 02 — introdução, off e encerramento:**

- Selecionar a tentativa em que ele fala a expressão sobre a percepção de um projeto sem travar.
- Escolher imagens naturalmente suaves, como no primeiro vídeo.
- **Sem legendas.** Pedido explícito.
- Depois, o Matheus pediu também para **tirar a música** porque faria isso na edição dele.
- Entrega final: imagem editada + voz, sem legendas e sem trilha.

## 4. Legendas

### 4.1. Regras explícitas

1. Fonte inicialmente pedida: **Futura**.
2. Depois o Matheus enviou duas referências para reproduzir a fonte e principalmente o movimento das legendas.
3. Texto deve entrar, subir e sair de maneira dinâmica, acompanhando a fala.
4. Texto **limpo**, com **sombra suave atrás das letras**.
5. **Sem traçado ou contorno preto**, em todas as edições deste projeto.
6. Aumentar o tamanho quando estiver pequeno; isso foi uma correção direta do Studio Arko.
7. Aproximar as linhas; entrelinha exagerada foi rejeitada.
8. Posicionar no espaço livre **ao lado da pessoa**, principalmente no horizontal.
9. Não colocar automaticamente todas as legendas no “meião” da tela.
10. Percentuais e benefícios promocionais merecem tamanho maior e destaque.
11. Corrigir a transcrição com o roteiro e os nomes reais.

### 4.2. Referências reais

Links enviados:

- `https://www.instagram.com/reel/DesLMAlolhj/?psln=d2xlY2YxMWliaWUw`
- `https://www.instagram.com/reel/DeNSiMUoMqx/?psln=dTd6MmJ0dWVldTly`

Como os Reels não carregaram na ocasião, o Matheus enviou os vídeos locais:

- `/Volumes/MATZU/GERAL/snapinsta-1794843769808.mp4`
- `/Volumes/MATZU/GERAL/snapinsta-1794843814876.mp4`

Esses dois arquivos ainda estavam presentes na verificação de 25/11/2026. O próximo assistente deve abri-los se precisar reproduzir com precisão o desenho e a animação. Não afirmar que identificou a fonte exata apenas por aparência.

### 4.3. Fonte exata: o que sabemos e o que não sabemos

- A família **Futura** é uma preferência explícita para Gabriel.
- Não há neste histórico uma confirmação inequívoca da variante exata da fonte dos dois Reels.
- Em outros projetos locais, como Stella e Constru-Tech, há documentação de **Futura LT Pro Light**, inclusive nome interno `FuturaLTPro-Light`. Isso é evidência daqueles projetos, não prova de que os dois Reels usam essa mesma variante.
- Fontes locais utilizadas/disponíveis durante o trabalho incluíram:
  - `/System/Library/Fonts/Supplemental/Futura.ttc`
  - `/System/Library/Fonts/HelveticaNeue.ttc`
- Uma substituição por Helvetica Neue não equivale à aprovação de uma nova fonte padrão. Se for necessária por disponibilidade, tratar como alternativa técnica.

### 4.4. Tamanhos, cores, coordenadas e unidades

O Matheus não fixou um único tamanho em pixels para todas as legendas de Gabriel. Ele aprovou o resultado visual e corrigiu tamanho, posição e entrelinha. Portanto, **não existe uma tabela universal de tamanhos autorizada para qualquer take**.

Valores realmente utilizados na implementação promocional relacionada da Constru-Tech, em canvas **1080 × 1920**, úteis como referência de escala:

| Elemento | Tamanho ASS | Centro vertical usado |
| --- | ---: | ---: |
| Linha comum simples | 82 | y = 1470 |
| Duas linhas comuns | 77 e 85 | y = 1405 e 1500 |
| “BLACK” e “FRIDAY” | 165 | y = 1345 e 1505 |
| Palavra “PROMOÇÕES” | 133 | y = 1470 |
| Percentual principal / “12x” | 300 | y = 1480 |
| “ATÉ” | 65 | y = 1325 |
| “DE DESCONTO” / “SEM JUROS” | 66 | y = 1660 |

Esses valores são do sistema de coordenadas ASS com `PlayResX: 1080` e `PlayResY: 1920`. Não são equivalentes ao número mostrado no CapCut. Não aplicá-los cegamente ao horizontal ou ao Studio Arko.

**Cores utilizadas nesse exemplo:**

- Branco: `#FFFFFF`, ASS `&H00FFFFFF&`.
- Verde de destaque: `#80E0A2`, ASS em ordem BGR `&H00A2E080&`.
- Sombra: preta, deslocamento de **+2 em x e +5 em y**, `blur=8`, alpha ASS `78` hexadecimal no exemplo.
- Na configuração ASS, alpha `00` é opaco e `FF` é transparente.

Para Gabriel, manter branco como base e adequar o destaque à identidade da loja. Não transportar automaticamente o verde da Constru-Tech para outra marca.

### 4.5. Posição e composição

- Vertical: aproveitar espaço livre real do plano e proteger rosto, mãos e produto. Terço inferior pode funcionar, mas não é uma obrigação.
- Horizontal: recompor o texto para a proporção 16:9 e usar o espaço lateral. O Matheus rejeitou especialmente a posição central das legendas nessa versão.
- Não basta redimensionar uma legenda vertical para caber no horizontal.
- Evitar blocos de texto distantes entre si, linhas excessivamente separadas e texto sem hierarquia.
- Quando houver duas linhas, montar uma unidade visual compacta.
- Conferir se a interface da plataforma pode cobrir texto importante. Não há margem numérica fixa fornecida pelo Matheus.

### 4.6. Palavras por linha e emojis

- Não foi definido um número fixo de palavras por linha.
- Preferir blocos curtos, quebrados pelo sentido, dimensionados para leitura em celular.
- Uma frase não precisa aparecer inteira de uma vez; entradas progressivas ajudam o ritmo.
- Não separar nome de marca, percentual e unidade de maneira confusa.
- O Matheus não estabeleceu uma preferência por emojis nas legendas sobre o vídeo. Não acrescentá-los como regra.
- Emojis apareceram em uma legenda de publicação para Instagram. Esse é outro produto: não confundir legenda do post com subtítulo do vídeo.

### 4.7. Animação de referência técnica

Implementação usada na promoção relacionada da Constru-Tech:

- Entrada subindo **28 unidades** em **170 ms**.
- Fade de entrada **65 ms** e saída **85 ms**.
- Destaque com escala inicial **78%**, pico de **110% em 130 ms**, acomodando em **100% até 250 ms**.
- Nenhum contorno; sombra em camada separada.

Exemplo de tags ASS:

```text
\move(540,1498,540,1470,0,170)\fs82\bord0\shad0\fad(65,85)
\fscx78\fscy78\t(0,130,\fscx110\fscy110)\t(130,250,\fscx100\fscy100)
```

Essa é uma implementação real de subida/pop, não a prova de que a referência do Instagram usa esses tempos. Para Arko e vídeos mais institucionais, dosar a intensidade.

## 5. Áudio

### 5.1. Música: direção criativa

- Buscar variedade. O Matheus reclamou da repetição de músicas e pediu explicitamente mais iniciativa na pesquisa.
- Fonte autorizada por ele: **Pixabay**, com conta disponível na ocasião.
- Para promoções: música impactante, feliz, alegre, animada, “pra cima”, com energia de anúncio.
- Para passeios visuais: música que dê movimento; evitar uma escolha lenta e melancólica quando a proposta é apresentar a loja.
- Não interpretar “sofisticado” como música triste. A rejeição de “música de funerária” foi muito clara.
- “Impactante” é uma combinação de escolha musical, arranjo, ritmo e montagem. Não é apenas deixar a música alta.
- Não reutilizar uma música rejeitada no mesmo projeto.
- Se o Matheus pedir para remover a música, remover de fato e manter a voz.

### 5.2. Histórico de trilhas

| Trilha/arquivo | Contexto e status |
| --- | --- |
| `energetic-hip-hop.mp3` / Energetic Hip-Hop, Skilsel | Usada na última versão de Taubaté Conceito com caixa registradora; a conversa seguiu para outro trabalho sem nova rejeição dessa versão |
| `futuristic-beat.mp3` | Tentativa rejeitada no promocional de roupas |
| `music-pixabay.mp3` / Exciting Podcast Intro | Tentativa anterior; não deve ser tomada como escolha final aprovada |
| `sub_clair-lifestyle-instrumental-631809.mp3` | Usada na revisão animada de Elmax 01; o vídeo final foi elogiado |
| `nra-lab-upbeat-fashion-lounge-350929.mp3` | Rejeitada na campanha Constru-Tech por ser pouco impactante/“chatinha” |
| `lightbeatsmusic-joyful-rhythm-walk-funk-513936.mp3` | Substituição na Constru-Tech; o Matheus depois pediu apenas aumentos de volume e salvamento no Drive |

Essas músicas não são um cardápio obrigatório para Gabriel. A lista serve principalmente para não repetir erros e identificar o que está nos exemplos.

### 5.3. Volume: preferência real

- A voz deve ser ouvida **nitidamente**.
- Os efeitos também precisam ser percebidos.
- A trilha pode ter presença e, em promoção, precisa ter energia; não deve ficar quase inaudível por excesso de cautela.
- No promocional de roupas, a música ficou alta em várias revisões e o Matheus pediu redução.
- Na Constru-Tech, depois de escolher uma trilha melhor, ele pediu **+2 dB** e depois **mais +2 dB**, sem mudar voz e efeitos.
- Portanto, não existe uma regra universal de “música sempre em -X dB”. Avaliar cada fonte e a mixagem completa.

### 5.4. Valores exatos do exemplo de mixagem mais recente

Constru-Tech, exemplo relacionado; não é um preset obrigatório de Gabriel:

```text
Música normalizada:
loudnorm=I=-16:TP=-2:LRA=8

Volume inicial da música:
volume=0.14

Após o primeiro pedido de +2 dB:
volume=0.1763

Após o segundo pedido de +2 dB:
volume=0.2219
```

Fórmula: `ganho_linear_novo = ganho_linear_anterior × 10 ** (aumento_dB / 20)`.

- `0.14 × 10 ** (2/20) ≈ 0.1763`.
- `0.14 × 10 ** (4/20) ≈ 0.2219`.
- Esses multiplicadores vêm **depois** da normalização de música. Não significam que o arquivo final tem loudness integrado de -16 LUFS.
- Medição de referência da voz já tratada daquele BLACK.mov: média `volumedetect` de aproximadamente **-22,5 dBFS**, pico próximo de **0 dBFS**. Média RMS/dBFS não é LUFS.
- No final, limitador `alimiter=limit=0.94:level=0:latency=1`.
- Mixagem `amix` com `normalize=0`, para não rebaixar automaticamente todo o conjunto ao somar entradas.

### 5.5. Tratamento de voz

- Manter a voz original de Gabriel, incluindo o off gravado.
- Não sintetizar frases ou clonar voz sem um pedido específico.
- Usar a melhor tentativa disponível antes de tentar mascarar um erro.
- Se o Matheus fornecer vídeo com áudio já tratado, usá-lo como nova fonte de trabalho. Na Constru-Tech ele fez exatamente isso com `BLACK.mov`.
- Não aplicar de novo uma cadeia pesada ao áudio que ele acabou de tratar sem necessidade.
- Preservar sincronismo labial e continuidade do off ao mudar as imagens.

Exemplos técnicos utilizados em fases deste fluxo:

```text
highpass=f=80
loudnorm=I=-16:TP=-2:LRA=7
aresample=48000
```

Outras implementações históricas incluíram passa-altas na região de 70–82 Hz e compressão leve. Não há um compressor, redução de ruído ou alvo LUFS imposto pelo Matheus para todos os trabalhos. Verificar a gravação antes de processar.

### 5.6. Efeitos sonoros

**Biblioteca prioritária e instrução explícita:**

```text
/Volumes/MATZU/GERAL/SFX
```

Inventário verificado em 25/11/2026:

```text
dragon-studio-keyboard-typing-sound-effect-335503.mp3
kauasilbershlachparodes-chutter-click-494024.mp3
ksjsbwuil-middle-gear-513910.mp3
makoto-ae-swoosh-2-359826.mp3
makoto-ae-swoosh-5-359829.mp3
matthewvakaliuk73627-computer-keyboard-typing-290582.mp3
photos-click-409642.mp3
u_1pruylktlg-riser-7-130957.mp3
universfield-computer-mouse-click-352734.mp3
```

Escolher conforme corte, gesto e fala. Não colocar whoosh em toda mudança automaticamente.

**Dinheiro/“moeda”:** o Matheus explicou que queria o efeito clássico de **caixa registradora**, “plim-plim”/“ka-ching”. Não era simplesmente moedas caindo ou rolando. Essa distinção resolveu uma rejeição no promocional de roupas.

- Ele autorizou procurar efeitos de dinheiro também no Pixabay.
- Foi usado um `kaching.wav`; uma cópia ainda estava em `/tmp/construtec-black-v2/kaching.wav` na elaboração deste guia.
- O arquivo utilizado nesse caminho foi obtido de `https://slapalert.com/assets/sounds/cha-ching.ad14525b.wav`, com origem/licença registrada à época como CC0. Se for redistribuir, preservar a referência e conferir o arquivo correspondente.
- O próximo assistente deve guardar a cópia de trabalho em pasta persistente. `/tmp` não é uma biblioteca permanente.

Valores do exemplo Constru-Tech:

| Som | Ajuste usado |
| --- | --- |
| Caixa registradora | Trecho de 1,15 s, `volume=0.30` |
| Clique de câmera | Trecho de 0,38 s; `loudnorm=I=-20:TP=-3:LRA=5`, depois `volume=0.45` |
| Swoosh | Trecho de 0,55 s, `volume=0.20` |

Não comparar esses multiplicadores diretamente entre arquivos: os sons originais têm níveis diferentes.

## 6. Organização, discos e referências

### 6.1. Workspace

```text
/Users/matheussantos/Documents/ChatGPT/EDICAO
```

Estrutura existente:

```text
AGENTS.md
referencias/
entregas/
  gabriel/
  construtec-novembro/
  elmax/
```

O `AGENTS.md` do projeto registra:

> “Nas legendas de todas as edições deste projeto, use texto limpo, com sombra suave atrás das letras e sem traçado ou contorno preto.”

O Matheus também forneceu a instrução da biblioteca de SFX no contexto do workspace. Respeitar as duas, mesmo quando um script antigo contradisser alguma delas.

### 6.2. Nomes falados e caminhos

- O Matheus pode se referir oralmente ao disco como “Matrizo”, “Matos”, “Matheus” ou “Matzu”. Não montar um caminho por adivinhação.
- Confirmar os volumes montados e procurar o arquivo correspondente.
- O SSD chamado `Untitled` não estava montado na última verificação. Os volumes presentes eram `Backup`, `MATZU`, `Macintosh HD`, `Reservado pelo Sistema` e `ZVE10-2`.
- Estrutura observada de câmera: `PRIVATE/M4ROOT/CLIP`.
- Exemplo confirmado de fonte posterior: `/Volumes/ZVE10-2/PRIVATE/M4ROOT/CLIP/C8666.MP4`.
- Arquivo com áudio tratado: `/Volumes/MATZU/CONSTRUTECH/BLACK.mov`.
- Pastas de referência Belas Artes 1 e 2 foram descritas como dentro de Gabriel no diretório do disco de trabalho. O caminho absoluto completo delas não está confirmado neste guia.

### 6.3. Não confiar em temporários

Diretórios usados historicamente:

```text
/tmp/gabriel-arko
/tmp/gabriel-loja
/tmp/elmax
/tmp/construtec-promo
/tmp/construtec-black-v2
/tmp/construtec-black-v3
/tmp/construtec-badge
```

Em 25/11/2026 vários scripts iniciais de Gabriel, Arko e Elmax já não estavam disponíveis, embora algumas subpastas ainda existissem. Não exigir esses arquivos para continuar o trabalho.

Scripts relacionados ainda encontrados nessa data:

```text
/tmp/construtec-promo/build.py
/tmp/construtec-black-v2/build.py
/tmp/construtec-black-v3/build.py
/tmp/construtec-black-v3/raise-music.py
/tmp/construtec-black-v3/raise-music-4db.py
```

São implementações históricas com dependências entre arquivos e caminhos locais. Não executá-las sem ler o código. Uma versão antiga pode conter uma trilha rejeitada ou um ganho anterior à aprovação.

**Procedimento recomendado para a migração:** guardar plano de edição, fonte de transcrição, legendas, música, SFX e scripts em uma pasta permanente por projeto; usar `/tmp` apenas para intermediários descartáveis.

## 7. Fluxo de trabalho completo

### Passo 1 — Entender qual vídeo está sendo pedido

Identificar se é passeio sem fala, apresentação com off ou promoção. Recuperar a referência correta, a última versão comentada e as exceções: sem legenda, sem música, dois formatos etc.

Não reiniciar um trabalho já aprovado porque chegou uma correção pequena.

### Passo 2 — Localizar e inspecionar as fontes

1. Listar discos montados.
2. Localizar o intervalo de clipes indicado.
3. Ler duração, resolução, rotação, fps, codec e áudio.
4. Conferir se existe versão tratada ou outro arquivo mais recente fornecido pelo Matheus.
5. Não confiar só no nome da pasta; verificar imagem e áudio.

### Passo 3 — Separar as falas boas

1. Extrair áudio leve para transcrição.
2. Transcrever em português.
3. Localizar erros, tentativas e última fala válida.
4. Conferir nomes e condições com o roteiro do Matheus.
5. Marcar entradas e saídas sem comer palavras.

### Passo 4 — Examinar os planos por dentro

1. Fazer uma visão geral por quadros de referência.
2. Rever em movimento os intervalos candidatos.
3. Marcar onde a câmera se assenta e onde começa a perder estabilidade.
4. Registrar a ação real de cada intervalo, por exemplo “olha duas peças e aproxima”.
5. Selecionar mais de um ambiente quando o material tiver variedade.

Uma folha de quadros localiza conteúdo; ela não comprova suavidade. Para aprovar estabilidade, ver a sequência em movimento.

### Passo 5 — Montar a voz e a narrativa

Escolher gancho, apresentação, benefícios e fechamento. Colocar a fala correta na ordem, mantendo espaço natural. Se o vídeo for só visual, montar a progressão da visita.

### Passo 6 — Colocar as imagens de apoio

Sincronizar cada produto e ação com a expressão correspondente. Preservar aberturas contínuas. Não adicionar imagem de tênis fora do benefício do look completo.

### Passo 7 — Reenquadrar cada proporção

Revisar Gabriel, mãos, produtos e texto em 9:16. Se houver 16:9, fazer a composição específica do horizontal, sobretudo a posição lateral das legendas.

### Passo 8 — Aplicar legendas quando solicitadas

Usar Futura, branco e sombra suave. Compor blocos compactos, entrada progressiva/subida, destaque em benefícios. Conferir o texto final com o áudio montado, não com a transcrição bruta inteira.

### Passo 9 — Escolher trilha e efeitos

Escolher música adequada ao objetivo e diferente das rejeitadas. Usar SFX da biblioteca. Para promoção, sincronizar caixa registradora com o benefício; clique e transição quando fizerem sentido ou forem pedidos.

### Passo 10 — Mixar

Voz clara primeiro; depois equilibrar presença da música e dos efeitos. Ouvir o conjunto. Se o pedido for só aumentar a música em 2 dB, alterar apenas o ganho dela, não o volume do arquivo inteiro.

### Passo 11 — Verificar

- Abertura e fechamento, em movimento.
- Todos os pontos já reclamados.
- Ação correta para cada benefício.
- Voz sem palavras cortadas.
- Sem aceleração involuntária.
- Sem efeito de estabilização.
- Legenda sem contorno, sem erro, com tamanho e posição adequados.
- Música certa e efeitos audíveis.
- Proporção, fps e duração reais.

Não dizer “ouvi e conferi” se só foi usada uma transcrição automática. A verificação de áudio exige escuta; a de estabilidade exige movimento.

### Passo 12 — Entregar e preservar versões

- Exportar com nome claro e indicar qual é a revisão.
- Manter a versão anteriormente aprovada enquanto uma mudança nova está em avaliação.
- Dar link local utilizável ou salvar no destino pedido.
- Não prometer que está no Drive sem concluir o envio e confirmar o arquivo na pasta.
- Alterações novas em capa, etiqueta ou música não autorizam automaticamente apagar uma versão já salva no Drive.

## 8. Ferramentas e comandos

### 8.1. Ferramentas realmente utilizadas

- FFmpeg para inspeção, recorte, reenquadramento, composição, ASS, áudio e exportação.
- Python para planos de edição, geração de legendas, cálculos de tempo e execução dos comandos.
- Pillow e NumPy em tarefas auxiliares de medição/inspeção.
- Whisper local para transcrição em português.
- Arquivos ASS renderizados com libass para legendas animadas.
- Leitura visual de quadros e vídeos de referência.
- Ferramentas do Google Drive para localizar pasta, enviar arquivo e confirmar o envio quando solicitado.

Não há nesta conversa um projeto final de Gabriel comprovadamente editado em uma timeline ChatCut. Não alegar que os scripts são projetos nativos de um editor. CapCut aparece como referência de outros projetos e de unidades de fonte.

### 8.2. Executáveis encontrados

```text
FFmpeg:
/tmp/stella-check/ffmpeg-macos-x86_64-v7.1

Whisper CLI:
/tmp/stella-check/build/bin/whisper-cli

Python com bibliotecas:
/Users/matheussantos/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3
```

O caminho histórico do modelo Whisper era `/tmp/apartamentos1811/ggml-base.bin`, mas **esse modelo não estava mais presente em 25/11/2026**. O executável estava presente. Instalar/localizar um modelo multilíngue compatível antes de transcrever; não apresentar o comando como pronto para funcionar sem o modelo.

### 8.3. Inspeção básica

```bash
ls -1 /Volumes
rg --files /Volumes/MATZU -g '*C8477*' -g '*Belas*' -g '*Arko*'

FFMPEG='/tmp/stella-check/ffmpeg-macos-x86_64-v7.1'
"$FFMPEG" -hide_banner -i '/caminho/do/clipe.MP4'
```

O comando `ffmpeg -i` sem arquivo de saída retorna metadados e normalmente termina com aviso/erro por faltar saída. Isso é esperado nessa forma de inspeção. Se houver `ffprobe`, usá-lo para leitura estruturada.

Verificar metadados de rotação. Houve fontes gravadas em 3840 × 2160 com rotação de 90°; a imagem exibida era vertical. Não aplicar uma rotação extra sem conferir.

### 8.4. Extrair áudio para transcrição

```bash
"$FFMPEG" -hide_banner -y \
  -i '/caminho/fonte.MP4' \
  -vn -ar 16000 -ac 1 \
  '/pasta-do-projeto/transcricao.wav'
```

Exemplo de chamada usada com Whisper CLI:

```bash
WHISPER='/tmp/stella-check/build/bin/whisper-cli'
MODELO='/caminho-persistente/ggml-base.bin'

"$WHISPER" -m "$MODELO" -l pt -t 3 \
  -bs 1 -bo 1 -tp 0 -nf -ojf -otxt \
  -of '/pasta-do-projeto/transcricao' \
  '/pasta-do-projeto/transcricao.wav'
```

Na versão utilizada, `-ojf` permitiu JSON mais detalhado com tokens e tempos. Confirmar `--help` na instalação de destino. O modelo base errou nomes como Rohden, Selecta e Arquitech; essas grafias foram corrigidas a partir do contexto, nunca aceitas cegamente.

### 8.5. Inspeção visual econômica

Para procurar conteúdo, usar imagens reduzidas e intervalos direcionados, sem decodificar horas de 4K para criar um proxy completo desnecessariamente.

```bash
"$FFMPEG" -hide_banner -y \
  -ss 12 -t 8 -i '/caminho/fonte.MP4' \
  -vf 'fps=1,scale=270:-1,tile=4x2' \
  -frames:v 1 '/pasta-do-projeto/contato.jpg'
```

Para uma varredura ainda mais leve, foi usado `-skip_frame nokey`. Isso reduz a precisão temporal e não serve para decidir o corte final ou comprovar estabilidade.

### 8.6. Renderizar uma seleção sem acelerar

Exemplo técnico em vertical, **sem estabilização** e com duração preservada:

```bash
"$FFMPEG" -hide_banner -y \
  -threads 2 -filter_threads 1 \
  -ss 12 -t 8.05 -i '/caminho/fonte.MP4' \
  -vf 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=24' \
  -c:v libx264 -preset superfast -crf 19 -threads 3 \
  -pix_fmt yuv420p -c:a aac -b:a 224k \
  -movflags +faststart '/pasta-do-projeto/trecho.mp4'
```

O `crop` central desse exemplo só é adequado se a composição estiver boa. Ajustar a origem do recorte quando Gabriel, o tênis ou uma das peças saírem do quadro. `fps=24` é exemplo para fonte/entrega a 24; não converter tudo indiscriminadamente.

### 8.7. Exemplo real de cortes curtos e clique

Na Constru-Tech, a fonte tratada tinha 30,8 s a 30 fps. Foram mantidos estes intervalos:

```python
ranges = [
    (0, 11),
    (331 / 30, 469 / 30),
    (470 / 30, 673 / 30),
    (682 / 30, 30.8),
]
```

Resultado: aproximadamente **30,4333 s**. Os cliques e piscadas entraram na nova timeline em:

```text
11,0000 s
15,6000 s
22,3667 s
```

- Primeiro intervalo retirado: cerca de 1 quadro.
- Segundo: cerca de 1 quadro.
- Terceiro: 9 quadros, ou 0,3 s.
- Houve reenquadramento de alguns blocos: crop de **2076 × 3692** sobre fonte **2160 × 3840**, depois redução para 1080 × 1920.
- Piscada: branco a **30%** por 1 quadro, seguido de **10%** por 1 quadro, em 30 fps.
- Não repetir esses timecodes em outro vídeo. O exemplo mostra como ligar corte, reenquadramento e clique sem acelerar a pessoa.

### 8.8. Atualizar tempos depois de cortar

Uma função equivalente à usada para recalcular ASS e SFX:

```python
ranges = [(0, 11), (331/30, 469/30), (470/30, 673/30), (682/30, 30.8)]
starts = []
clock = 0.0
for a, b in ranges:
    starts.append(clock)
    clock += b - a

def retime(source_time):
    for i, (a, b) in enumerate(ranges):
        if source_time < a:
            return starts[i]  # ponto excluído: encaixar na próxima junção
        if source_time <= b:
            return starts[i] + source_time - a
    return clock
```

Para legendas que cruzem cortes grandes, pode ser necessário dividir eventos. Recalcular apenas início/fim não resolve automaticamente toda situação.

### 8.9. Exemplo de soma de áudio

Trecho de lógica utilizado, com cada efeito atrasado para seu tempo de entrada:

```text
[musica]loudnorm=I=-16:TP=-2:LRA=8,volume=0.2219[m];
[caixa]atrim=duration=1.15,asetpts=PTS-STARTPTS,volume=0.30,adelay=9640|9640[c];
[voz][m][c]amix=inputs=3:duration=first:normalize=0,
alimiter=limit=0.94:level=0:latency=1[a]
```

`9640` é milissegundos daquele exemplo. Usar o tempo recalculado se a fala tiver cortes. Normalizar a música antes de aplicar o ganho facilita ajustes incrementais sem mexer na voz.

### 8.10. Mudar só o áudio, sem recodificar a imagem

Foi o procedimento usado para os pedidos de +2 dB e +2 dB:

1. Refazer somente a mixagem a partir das faixas separadas.
2. Salvar, por exemplo, `mix-ajustada.m4a`.
3. Reunir com o vídeo já aprovado usando cópia do stream de vídeo.

```bash
"$FFMPEG" -hide_banner -y \
  -i '/pasta-do-projeto/video-aprovado.mp4' \
  -i '/pasta-do-projeto/mix-ajustada.m4a' \
  -map 0:v:0 -map 1:a:0 -c copy \
  -movflags +faststart '/pasta-do-projeto/video-volume-ajustado.mp4'
```

Não aumentar o áudio já mixado inteiro: isso também aumentaria voz e efeitos e contrariaria o pedido.

### 8.11. Exemplo de legenda ASS sem contorno

Configuração mínima de estilo, com sombra feita separadamente:

```text
[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes
[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Clean,Futura,82,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,0,0,0,1
[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
Dialogue: 0,0:00:01.00,0:00:02.20,Clean,,0,0,0,,{\pos(542,1475)\c&H000000&\alpha&H78&\blur8\bord0}exemplo de texto
Dialogue: 1,0:00:01.00,0:00:02.20,Clean,,0,0,0,,{\move(540,1498,540,1470,0,170)\bord0\shad0\fad(65,85)}exemplo de texto
```

Esse bloco demonstra a técnica; a coordenada não é adequada automaticamente ao plano horizontal. Em produção, animar a sombra junto com o texto para não haver separação durante a entrada.

### 8.12. Cuidados de implementação aprendidos

- Preferir `subprocess.run([...])` com argumentos separados ao interpolar comandos de shell em Python.
- Caminhos de vídeos têm espaços e acentos; sempre fazer quoting correto.
- FFmpeg recusou `atrim=duration=.55`; a forma usada na correção foi `duration=0.55`. Usar zero antes da vírgula decimal nos argumentos de duração.
- Não ler um MP4 que ainda está sendo finalizado. Um erro `moov atom not found` pode significar que a renderização ainda não terminou.
- Aguardar o processo terminar e então inspecionar o resultado.
- Houve tentativas de encoder de hardware; o fluxo que permaneceu nos scripts promocionais usa `libx264`. Testar compatibilidade antes de apostar todo o render em VideoToolbox.
- Limitar threads ajudou a manter a máquina utilizável: exemplos com 2 threads de entrada, 1 de filtros e 3 de x264. Esses números não são uma preferência estética do Matheus.

## 9. Configurações de exportação

### 9.1. Parâmetros usados

| Item | Prática observada |
| --- | --- |
| Contêiner de entrega | MP4; MOV também aceito em pedido de salvamento |
| Vertical | 1080 × 1920, 9:16 |
| Horizontal | 1920 × 1080, 16:9 |
| Vídeo | H.264 / AVC, normalmente `libx264` |
| Pixel format | `yuv420p` |
| Proporção de pixel | SAR 1:1 / `setsar=1` |
| FPS Gabriel | Entregas verificadas em torno de 24 fps; conferir fonte e arquivo |
| FPS da fonte tratada Constru-Tech | 30 fps, mantido na exportação |
| CRF dos exemplos relacionados | 18 ou 19 |
| Preset | `superfast` para final em exemplos recentes; `ultrafast` em intermediários e algumas entregas antigas |
| Áudio | AAC, estéreo; exemplos de 224 ou 256 kb/s |
| Sample rate de trabalho | 48 kHz em várias cadeias; fonte tratada também existiu em 44,1 kHz |
| Streaming progressivo | `-movflags +faststart` |

Não há uma exigência do Matheus de bitrate fixo. Os arquivos foram produzidos principalmente por qualidade constante (CRF), então o bitrate varia com conteúdo e preset.

### 9.2. Bitrates efetivamente lidos nos finais de Gabriel

| Entrega | Bitrate de vídeo informado pelo FFmpeg |
| --- | ---: |
| Arko vertical — Só voz | 21.549 kb/s, aproximadamente 21,55 Mb/s |
| Arko horizontal — Só voz | 23.595 kb/s, aproximadamente 23,60 Mb/s |
| Taubaté — Caixa registradora | 17.844 kb/s, aproximadamente 17,84 Mb/s |
| Elmax 01 — Última revisão | 23.384 kb/s, aproximadamente 23,38 Mb/s |
| Elmax 02 — Só voz | 24.470 kb/s, aproximadamente 24,47 Mb/s |

Esses números descrevem arquivos reais; não são limites mínimos a impor a todo projeto. Presets muito rápidos costumam resultar em arquivos maiores.

### 9.3. Cuidado com fps

- Arko e Taubaté foram informados como 24 fps na inspeção.
- Elmax 02 também apareceu como 24 fps.
- Elmax 01 apareceu com taxa média aproximada de **24,03 fps** e taxa nominal de 24. Isso é uma característica observada do arquivo, não um alvo a reproduzir.
- Para nova exportação, definir fps coerente com a fonte e manter cadência regular. Não copiar “24,03” como preset.
- Não confundir ajustar fps de exportação com acelerar a duração da ação.

## 10. Correções já feitas pelo Matheus

| Erro/problema | Correção desejada |
| --- | --- |
| Escrever Studio Arco | Usar **Studio Arko** |
| Transcrição com palavras diferentes | Usar roteiro fornecido e conferir a gravação |
| Legenda no meio da pessoa, especialmente no horizontal | Usar espaço ao lado, com composição adequada ao plano |
| Texto pequeno | Aumentar para leitura clara no celular |
| Linhas muito separadas | Aproximar a entrelinha |
| Traçado preto nas legendas | Remover em todas as edições; usar sombra suave |
| Música repetida | Pesquisar opções diferentes, inclusive no Pixabay |
| Música melancólica em passeio comercial | Escolher algo mais animado |
| Música encobrindo a fala | Diminuir e conferir a mixagem completa |
| Música tímida em anúncio, após acertar a escolha | Subir gradualmente quando pedido, sem mexer na voz |
| Som de moedas diferente do desejado | Usar caixa registradora, “plim-plim”/ka-ching |
| Estabilizador deixando a imagem estranha | Tirar o estabilizador e selecionar outro intervalo |
| Gabriel acelerado entrando/andando | Voltar à velocidade natural |
| Duas peças com Gabriel só sorrindo | Usar a parte em que olha para elas e as aproxima |
| Tênis entrando antes da hora | Reservar para a fala de montar o look completo |
| Começo do take com câmera sendo ajustada | Começar depois do ajuste |
| Final em que a câmera desce | Sair antes desse movimento |
| Final com Gabriel se preparando para andar | Selecionar a passagem/caminhada já em andamento |
| Corte na abertura contínua da Elmax | Preservar logo/fachada → Gabriel em um movimento só |
| Pouca variedade de luminárias | Explorar mais intervalos de C8454 e C8455 |
| Fala travada no Elmax 02 | Encontrar outra tentativa fluente |
| Legendas no Elmax 02 | Tirar; pedido explícito |
| Música no Arko/Elmax 02 após pedido de só voz | Remover trilha, preservar voz |
| Revisões que não resolvem os pontos indicados | Conferir cada ponto em movimento antes de renderizar de novo |

## 11. Exemplos de pedidos e resposta operacional correta

### Exemplo A — “Quero os dois formatos, 9:16 e 16:9”

**Ação:** finalizar a montagem e fazer dois reenquadramentos. Manter Gabriel bem posicionado, verificar produtos e recompor as legendas lateralmente no horizontal.

**Resposta curta apropriada depois de concluir:** “Entreguei as duas versões, vertical e horizontal, com o enquadramento e as legendas ajustados para cada formato.”

Não dizer isso antes de conferir os dois arquivos.

### Exemplo B — “Não era para colocar estabilizador”

**Ação:** remover o filtro, localizar uma parte realmente mais firme, comparar com o intervalo rejeitado e substituir. Não tentar outro estabilizador.

**Resposta de andamento apropriada:** “Vou retirar o estabilizador e trocar esse trecho por uma parte com movimento mais suave da própria gravação.”

### Exemplo C — “Escolhendo duas peças, ele tem que olhar e aproximar”

**Ação:** percorrer o take até a ação solicitada; não usar uma pose parecida. Sincronizar com a fala das duas peças e manter o tênis fora desse bloco.

### Exemplo D — “Pode deixar sem som, só deixa a voz dele mesmo”

**Interpretação no contexto:** retirar a música, preservar a voz. O Matheus disse que faria o tratamento e a música depois.

**Ação:** exportar a mesma edição com voz, sem trilha. Não entregar arquivo mudo.

### Exemplo E — “Aumenta um pouquinho, esses mais dois aí”

**Ação:** +2 dB apenas no canal da trilha, mantendo voz e efeitos. Fazer mixagem de áudio e remux sem recodificar a imagem.

**Resposta efetivamente usada nesse fluxo relacionado:** “Aumentei mais 2 dB na música, mantendo a voz e os efeitos.”

### Exemplo F — “Belas Artes 1 e 2, agora para Elmax”

**Ação:** um vídeo de passeio visual e outro com introdução/off/encerramento. Depois respeitar as exceções definidas para Elmax 02: sem legenda e sem trilha.

### Exemplo G — “Está gastando meus créditos; já falei para tirar essa cena”

**Ação:** parar de fazer substituições por tentativa vaga. Registrar os intervalos reclamados, escolher novas partes verificadas e validar todos os pontos antes de novo render.

Não justificar repetidamente o processo. Entregar uma correção específica e conferida.

## 12. Arquivos de referência final para a migração

Todos os caminhos abaixo são locais. Copiar os arquivos necessários para o ambiente do novo assistente.

### 12.1. Studio Arko

```text
/Users/matheussantos/Documents/ChatGPT/EDICAO/entregas/gabriel/Gabriel - Studio Arko - Vertical 9x16 - Só voz.mp4

/Users/matheussantos/Documents/ChatGPT/EDICAO/entregas/gabriel/Gabriel - Studio Arko - Horizontal 16x9 - Só voz.mp4
```

Para estudar a evolução das legendas, também existem versões com “Legendas ajustadas” no nome. Não tratar arquivos antigos com “Arco” como referência de grafia.

### 12.2. Taubaté Conceito

```text
/Users/matheussantos/Documents/ChatGPT/EDICAO/entregas/gabriel/Gabriel - Taubaté Conceito - Look da festa - Vertical 9x16 - Nova trilha e caixa registradora.mp4
```

Referência para entrada natural e montagem anterior:

```text
/Users/matheussantos/Documents/ChatGPT/EDICAO/entregas/gabriel/Gabriel - Taubaté Conceito - Look da festa - Vertical 9x16 - Entrada natural.mp4
```

Existe uma versão chamada “Nova trilha e moedas”; ela não deve prevalecer sobre a correção posterior para caixa registradora.

### 12.3. Elmax

```text
/Users/matheussantos/Documents/ChatGPT/EDICAO/entregas/gabriel/Elmax 01 - Revisão dos trechos indicados.mp4

/Users/matheussantos/Documents/ChatGPT/EDICAO/entregas/gabriel/Elmax 02 - Sem legendas - Só voz.mp4
```

A primeira é a referência visual de estabilidade aprovada. A segunda é a referência final de estrutura com fala, sem legenda e sem música.

### 12.4. Promoção relacionada usada como evolução de linguagem

```text
/Users/matheussantos/Documents/ChatGPT/EDICAO/entregas/construtec-novembro/Construtec - Black Friday - Trilha mais 4 dB.mp4

/Users/matheussantos/Documents/ChatGPT/EDICAO/entregas/construtec-novembro/Construtec - Black Friday - Etiqueta animada.mp4
```

Não são vídeos de Gabriel. Foram incluídos porque o Matheus pediu que essa edição tivesse a pegada da promoção de Gabriel e depois refinou música, caixa registradora, clique e destaques.

## 13. Regras complementares aprendidas em trabalhos relacionados

### 13.1. Identidade da marca e logo

- Usar cores da marca quando solicitado.
- A presença da logo é uma decisão por peça. O Matheus mandou retirar a logo do vídeo promocional Constru-Tech, mas depois pediu a logo na capa.
- Não interpretar “sem logo neste vídeo” como proibição eterna da marca.
- Não inserir a pessoa na capa automaticamente: ele rejeitou a capa com a apresentadora e pediu versão sem ela.
- Para reproduzir uma logo existente, priorizar fidelidade ao arquivo original. Uma reconstrução gerada não deve ser chamada de vetor original ou reprodução exata sem verificação.

### 13.2. Capas e miniaturas

- O Matheus avalia a capa tanto grande quanto na miniatura do perfil.
- Ele questionou informações espalhadas e texto pequeno.
- A solução buscada foi concentrar logo, “BLACK FRIDAY” e ofertas em uma composição central.
- Quando a promoção envolver várias marcas, não fazer parecer que só a Rohden participa.
- A última direção de copy da capa Constru-Tech foi **“8% a 10% OFF”**, **“até 12x sem juros”** e marcas **Rohden • Selecta • Arquitech**.
- Esses números são daquela campanha. Não reaplicar no promocional de roupas de Gabriel.
- Manter condições e marcas coerentes: uma capa agregada não deve sugerir que toda linha recebe simultaneamente todos os benefícios.

### 13.3. Etiqueta animada

O Matheus sugeriu um símbolo de Black Friday pequeno no canto, pendurado, subindo e descendo suavemente durante todo o vídeo. A implementação relacionada colocou uma etiqueta sem fundo cinza no canto superior direito.

Valores reais dessa versão, canvas 1080 × 1920:

```text
Asset escalado para largura de 320 px, incluindo margens transparentes.
x = largura_do_video - largura_da_etiqueta - 28
y = 68 + 8 × sen(2πt / 4,8)
rotação = 0,012 × sen(2πt / 4,8) radianos
```

É uma oscilação de 8 px para cada lado da posição vertical e rotação de cerca de 0,69°. Não é para repetir esse adereço em vídeos institucionais sem pedido.

### 13.4. Salvamento no Drive

Pedido real da Constru-Tech: salvar só como **Black Friday.mp4** dentro de **CONSTRUTECH → VIDEOS**.

Há mais de uma pasta chamada CONSTRUTECH no Drive. Foi necessário listar os conteúdos para achar aquela que contém VIDEOS. Não escolher apenas a primeira ocorrência pelo nome.

O envio foi feito após autorização explícita, com nome definido pelo Matheus, e confirmado pela listagem da pasta. Isso é um exemplo de fluxo; não há aqui uma pasta de Drive de Gabriel confirmada.

## 14. O que não pode ser inventado pelo próximo assistente

- Fonte exata dos Reels sem analisar os arquivos e, se possível, identificar o recurso tipográfico.
- Percentuais da campanha de roupas sem conferir a gravação.
- Trecho correto só porque o nome do clipe parece adequado.
- Aprovação de uma música que foi rejeitada ou simplesmente não comentada.
- Regra universal de fps, duração, volume, tamanho de fonte ou zoom quando só existe um exemplo.
- Estabilidade baseada em um quadro parado.
- Que um arquivo temporário ainda existe.
- Que uma fonte já tratada precisa obrigatoriamente de novo tratamento.
- Que todos os vídeos devem ter legenda e música.
- Que a última versão enviada no chat já substituiu o arquivo no Drive.
- Que uma imagem gerada é idêntica à logo original ou tem resolução maior do que seus pixels reais.

## 15. Checklist de entrega

### Conteúdo

- [ ] Usei a última direção do Matheus para este vídeo.
- [ ] Escolhi as tentativas corretas e retirei bastidores/repetições.
- [ ] Conferi nomes de marca e palavras do roteiro.
- [ ] Cada benefício tem a ação visual correspondente.
- [ ] O fechamento usa a tentativa indicada.

### Imagem

- [ ] Não apliquei estabilizador.
- [ ] Assisti em movimento aos trechos com câmera instável.
- [ ] Não há ajuste inicial de câmera ou queda no final da tomada.
- [ ] Gabriel anda em velocidade natural.
- [ ] Preservação da abertura contínua quando for o caso.
- [ ] Rosto, mãos, peças e tênis importantes cabem no enquadramento.
- [ ] As duas proporções foram compostas separadamente se solicitadas.

### Legendas

- [ ] Existem apenas se forem pedidas/adequadas; Elmax 02 é sem legenda.
- [ ] Futura como base de identidade, sem substituição silenciosa de fonte.
- [ ] Sem contorno preto; sombra suave.
- [ ] Tamanho suficiente, linhas próximas e texto no espaço livre.
- [ ] Horizontal sem bloco automático no centro da pessoa.
- [ ] Descontos com hierarquia e sincronismo.
- [ ] Tempos atualizados após os cortes.

### Áudio

- [ ] Voz nítida e sem palavra cortada.
- [ ] Música adequada à energia do vídeo e diferente das rejeitadas.
- [ ] Efeitos da biblioteca do Matheus considerados primeiro.
- [ ] Caixa registradora é o som esperado quando ele pede “moeda”.
- [ ] Voz e efeitos preservados em ajustes só de música.
- [ ] Sem música quando pedido; voz continua presente.
- [ ] Mixagem conferida por escuta, não só por medição/transcrição.

### Arquivo

- [ ] Proporção, resolução, fps, áudio e duração conferidos.
- [ ] Exportação finalizada antes de abrir/enviar.
- [ ] Nome de versão claro e caminho persistente.
- [ ] Entrega local ou Drive conforme pedido.
- [ ] Nenhuma promessa de envio ainda não concluído.

## 16. Texto inicial para o outro assistente

> Você vai editar vídeos de Gabriel para Matheus Santos. Leia este guia e as instruções do workspace antes de começar. As prioridades são selecionar as falas e ações corretas, usar trechos naturalmente estáveis sem estabilizador, manter caminhadas na velocidade original e fazer a imagem corresponder à fala. As legendas, quando pedidas, usam Futura como referência, texto limpo com sombra suave e nenhum contorno preto; precisam ser grandes, compactas e posicionadas no espaço livre, especialmente ao lado da pessoa no horizontal. Para promoções, destacar benefícios e porcentagens, escolher música animada com variedade e usar efeitos da biblioteca `/Volumes/MATZU/GERAL/SFX`. “Moeda” significa principalmente caixa registradora/ka-ching. A voz deve continuar nítida. Respeite exceções: Arko tem versões só com voz e Elmax 02 é sem legendas e sem música. Veja os vídeos finais listados neste guia, não apenas os nomes. Não invente parâmetros universais a partir de um único render. Corrija precisamente o que foi apontado, revise antes de entregar e evite refazer imagem quando só o áudio mudou.

---

**Base documental:** pedidos e correções desta conversa; instruções do Matheus para o workspace; arquivos finais locais de Gabriel; metadados lidos em 25/11/2026; scripts relacionados ainda disponíveis nessa data. Valores específicos de Constru-Tech estão identificados como exemplos técnicos relacionados, e não como preferências universais dos vídeos de Gabriel.

# Vitrine do Corretor

Site de imóveis para **corretor autônomo**: ele cadastra os imóveis pelo celular, ganha um link próprio
(`seusite.com/nome-do-corretor`) e manda esse link pelo WhatsApp ou Instagram. Quem se interessa toca em
**"Tenho interesse"** ou **"Quero visitar"**, deixa nome e WhatsApp e cai direto na conversa com o corretor.
Todos os interessados ficam organizados no painel.

## O que tem

**Para o corretor (painel em `/painel/`)**
- Conta grátis com nome, WhatsApp, CRECI e cidade.
- Cadastro de imóvel pelo celular: fotos (reduzidas no próprio aparelho), venda/aluguel, tipo, bairro, preço,
  área, quartos, suítes, banheiros, vagas, condomínio, IPTU, diferenciais e descrição. Escolhe a foto de capa.
- Situação de cada imóvel: no ar, pausado (some da vitrine), vendido/alugado (aparece com selo).
- Interessados com filtro por etapa (Pediu contato, Quer visitar, Respondido, Visita marcada, Fechou negócio,
  Desistiu), anotação, botão de WhatsApp e aviso de novos interessados.
- Início com o link da vitrine, quantas pessoas abriram, imóveis mais vistos e quem responder primeiro.
- Perfil: apresentação, endereço da vitrine e cor da marca.

**Para o cliente (páginas públicas)**
- Vitrine com filtros (comprar/alugar, bairro, quartos) e página de cada imóvel com galeria, custos mensais e
  botões fixos de contato.
- Prévia com foto quando o link é colado no WhatsApp (tags Open Graph).

## Rodando

Requer **Node.js 22.5+**.

```bash
cd vitrine
npm install
npm start            # http://localhost:3000  (painel em /painel/)
npm run seed         # opcional: conta de teste demo@vitrine.com / 123456 -> /rafael-moura
npm test
```

Os dados ficam em `vitrine/data/` (banco SQLite e fotos). Variáveis opcionais: `PORT`, `DATA_DIR`, `UPLOADS_DIR`.

## Colocando no ar

Precisa de um servidor com **disco permanente** (banco e fotos ficam em arquivo). Ex.: Railway, Render ou Fly.io:
definir a pasta `vitrine` como raiz, comando `npm start`, montar um volume e apontar `DATA_DIR` para ele.

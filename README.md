# 📐 OrçaArq

Plataforma para **arquitetos montarem orçamentos** de projetos de arquitetura e interiores, com **lojas parceiras (anunciantes)** exibidas no momento do orçamento — **no máximo 3 lojas por segmento**.

## Como funciona

### Arquiteto(a)
- Cadastro de **clientes**.
- **Orçamentos por ambiente** (Cozinha, Living, Suíte…) com itens por **segmento** (Marcenaria, Iluminação, Revestimentos, Marmoraria…).
- Ao escolher o segmento de um item, aparecem **até 3 lojas parceiras** com WhatsApp, telefone, e-mail, site e Instagram. Dá para indicar a loja no item.
- Cálculo automático: subtotal, **honorários** (% ou valor fixo), desconto e total; resumo por segmento e por ambiente.
- Status (rascunho, enviado, aprovado, recusado), duplicar orçamento, painel com conversão.
- **Documento para o cliente** (imprimir / salvar PDF) com cabeçalho do escritório, itens, totais, observações, validade e a lista de **fornecedores indicados**.
- Vitrine de lojas parceiras por segmento.

### Lojista (anunciante)
- Cadastro escolhendo os segmentos em que quer anunciar e o plano (mensal, trimestral, anual).
- **Regra das 3 vagas:** se o segmento já tem 3 lojas ativas, a loja entra numa **fila de espera** e é ativada automaticamente quando uma vaga abre (cancelamento ou vencimento).
- Painel com métricas: exibições, cliques em contato, indicações em orçamentos e lista de arquitetos que entraram em contato.
- Edição do perfil com pré-visualização de como os arquitetos veem a loja.

### Administrador
- Aprova/recusa solicitações de lojistas, vê a ocupação das vagas de cada segmento, desativa assinaturas (promovendo a fila) e cria/oculta segmentos.
- Indicadores: arquitetos, lojas, orçamentos e receita recorrente estimada.

## Rodando

Requer **Node.js 22.5+** (usa o SQLite nativo `node:sqlite`, sem dependências nativas).

```bash
npm install
npm start          # http://localhost:3000
```

Na primeira execução o banco (`data/orcaarq.db`) é criado com dados de demonstração. Para recriar: `npm run seed`.

| Perfil     | E-mail                         | Senha  |
|------------|--------------------------------|--------|
| Arquiteta  | arquiteta@orcaarq.com          | 123456 |
| Lojista    | ateliermadeiranobre@loja.com   | 123456 |
| Admin      | admin@orcaarq.com              | 123456 |

Testes da API e das regras de negócio:

```bash
npm test
```

## Estrutura

```
server/
  db.js        # esquema SQLite e constante MAX_STORES_PER_SEGMENT (3)
  services.js  # senhas, sessões, vagas/fila de espera, totais do orçamento, métricas
  app.js       # rotas da API (Express)
  seed.js      # dados de demonstração
  index.js     # inicialização do servidor
public/        # SPA em JavaScript puro (sem build)
test/          # testes com node:test
```

## Próximos passos sugeridos
- Cobrança recorrente dos lojistas (ex.: Stripe, Mercado Pago, Asaas) ativando a vaga após o pagamento.
- Envio do orçamento por link público/e-mail com aceite do cliente.
- Catálogo de produtos por loja para preencher itens com preço sugerido.
- Filtro de lojas por cidade/região (3 vagas por segmento **por região**).
- Logo do escritório e da loja (upload de imagem).

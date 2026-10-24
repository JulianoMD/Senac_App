# Fila Zero · Senac

App para cortar as filas nas cantinas do campus. A pessoa escolhe uma refeição, paga pelo app e recebe um código de retirada com o próprio nome — no balcão, é só mostrar o código. As ofertas são refeições e lanches feitos no dia, perto de vencer, com preço reduzido: a cantina não perde mercadoria e quem compra paga menos.

**Abrir o app:** https://julianomd.github.io/Senac_App/

## Instalar no celular

O Fila Zero é um PWA: dá para instalar como um app, com ícone na tela inicial, e ele abre mesmo sem internet.

- **Android (Chrome):** abra o link, toque em **Perfil → Instalar o app no celular** ou no menu ⋮ → *Instalar app*.
- **iPhone (Safari):** abra o link, toque em **Compartilhar** e depois em **Adicionar à Tela de Início**.

A cada envio para o branch `main`, o GitHub Actions publica a versão nova automaticamente.

## Funcionalidades

- **Descobrir:** ofertas do dia com busca, categorias e o que está acabando.
- **Reservar e pagar:** Pix ou cartão (simulados), em três etapas.
- **Código de retirada:** ticket com nome, código e código de barras; no balcão, "deslize para retirar".
- **Pedidos:** códigos ativos e histórico de retiradas.
- **Favoritos** e **Perfil** com impacto, conquistas e cupons de desconto.
- Tour de boas-vindas, "primeiros passos" e ajuda com dúvidas frequentes.

## Como rodar

Com Docker (versão de produção, servida pelo nginx):

```bash
docker compose up --build -d
```

Abra http://localhost:8080. Para desenvolver com recarregamento automático:

```bash
docker compose --profile dev up --build dev
```

Sem Docker (Node 22 + pnpm):

```bash
pnpm install
pnpm dev
```

Abra http://localhost:8443.

## Tecnologias

React 19, TypeScript, Vite e Tailwind CSS v4. Animações com View Transitions API e CSS, respeitando a opção de reduzir movimento do sistema (que pode ser trocada em Perfil → Conta).

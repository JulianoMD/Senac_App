# Fila Zero · Senac

App para cortar as filas nas cantinas do campus. A pessoa escolhe uma refeição, paga pelo app e recebe um código de retirada com o próprio nome — no balcão, é só mostrar o código. As ofertas são refeições e lanches feitos no dia, perto de vencer, com preço reduzido: a cantina não perde mercadoria e quem compra paga menos.

**Abrir o app:** https://julianomd.github.io/Senac_App/

## Instalar no celular

O Fila Zero é um PWA: dá para instalar como um app, com ícone na tela inicial, e ele abre mesmo sem internet.

- **Android (Chrome):** abra o link, toque em **Perfil → Instalar o app no celular** ou no menu ⋮ → *Instalar app*.
- **iPhone (Safari):** abra o link, toque em **Compartilhar** e depois em **Adicionar à Tela de Início**.

A cada envio para o branch `main`, o GitHub Actions publica a versão nova automaticamente.

## Funcionalidades

- **Descobrir:** ofertas do dia com busca, categorias, o que está acabando e a distância a pé até o pátio.
- **Horário marcado:** ao reservar, a pessoa escolhe uma faixa de 10 minutos com poucas vagas — ninguém chega junto e não se forma fila.
- **Reservar e pagar:** Pix ou cartão (simulados), em três etapas, com mapa do campus até o pátio de retirada.
- **Código de retirada:** ticket com nome, horário, código e código de barras; no balcão, "deslize para retirar".
- **Refeição solidária:** pagar uma refeição a mais para um colega, ou usar um código da assistência estudantil para retirar de graça.
- **Modo cantina:** o lado de quem vende — retiradas na ordem dos horários, leitor do código, publicar sobras, impacto do dia e doação ao banco de alimentos.
- **Alertas:** horário chegando, retirada perto de fechar, favorita que abriu e oferta nova de uma cantina salva.
- **Desafio do campus:** meta coletiva da semana, ranking por curso e CO₂ evitado.
- **Pedidos, Favoritos e Perfil** com impacto, conquistas, cupons, modo escuro e tour de boas-vindas.

## Projeto de demonstração

Não há servidor nem dados reais: é um protótipo para apresentar a ideia.

- Ofertas, cantinas, pátios (distâncias), cursos e códigos solidários ficam no próprio código, em `src/data.ts`.
- Pedidos, favoritos e o que a cantina publica ficam salvos só no navegador do aparelho (`localStorage`).
- Pagamento, leitura do código e reservas dos outros estudantes são simulados.

**Como apresentar:**

1. Abra o app numa janela (o lado do aluno) e, em outra, o Modo cantina: https://julianomd.github.io/Senac_App/?modo=cantina — as duas ficam sincronizadas.
2. Reserve uma oferta escolhendo o horário; na janela da cantina, ela aparece em **Retiradas**. Confirme digitando o código que aparece no ticket do aluno (`FZ-` e quatro números).
3. Para a refeição solidária, use um destes códigos no pagamento: `SOL-2026`, `SOL-4821`, `SOL-1530` ou `SOL-7314` (cada um vale uma vez; a lista atualizada aparece em Modo cantina → Impacto).
4. Para começar de novo: **Perfil → Demonstração → Reiniciar demonstração**.

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

React 19, TypeScript, Vite e Tailwind CSS v4. Animações com View Transitions API e CSS, respeitando a opção de reduzir movimento do celular.

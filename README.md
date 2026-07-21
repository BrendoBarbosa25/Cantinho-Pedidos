# Cantinho — Sistema de Comandas para Restaurante

Aplicativo mobile para gestão de pedidos em restaurantes, com fluxo completo entre **Garçom**, **Cozinha** e **Administração**. Desenvolvido em **React Native (Expo)** no front-end e **Node.js + Express + PostgreSQL** no back-end.

## Visão geral

O app resolve o fluxo tradicional de comanda de restaurante de forma digital: o garçom abre uma comanda por mesa, registra os pedidos, a cozinha vê os pedidos em tempo real (via polling) e marca como prontos, o garçom é avisado quando o pedido está pronto pra retirada, e o administrador acompanha tudo com relatórios financeiros e gestão de usuários.

```
                         Login
                           │
        ┌──────────────────┼──────────────────┐
     garçom               cozinha              admin
        │                    │                   │
   Lista de Mesas         Cozinha             Dashboard
        │                                         │
     Comanda                              Mesas · Cozinha ·
                                        Criar Usuário · Relatório
```

## Funcionalidades

### 🧑‍🍳 Cozinha
- Fila de pedidos pendentes atualizada automaticamente a cada 10 segundos (polling)
- Exibe mesa, comanda e itens de cada pedido (nome, quantidade e observação)
- Botão para marcar pedido como pronto

### 🧑‍💼 Garçom
- Lista de mesas com status visual (livre / ocupada / pedido pronto)
- Abertura e fechamento de comanda com pop-up de confirmação (mostrando mesa e valor total)
- Feedback tátil (haptics) em ações importantes: confirmar/cancelar fechamento, retirar pedido, novo pedido pronto
- Aviso automático (cor + haptic) quando um pedido fica pronto na cozinha
- Gerenciamento de itens da comanda: adicionar do cardápio, remover, iniciar nova rodada de pedido

### 👤 Administrador
- Dashboard com visão geral de comandas abertas
- Acesso completo às telas de garçom e cozinha
- Cadastro de novos usuários (garçom, cozinha ou admin)
- Relatório financeiro de faturamento

## Stack técnica

**Front-end**
- React Native + Expo (testado via Expo Go)
- React Navigation (stacks separadas por role)
- Context API para autenticação (`AuthContext`)
- `expo-haptics` para feedback tátil

**Back-end**
- Node.js + Express
- PostgreSQL
- Autenticação via JWT (`auth` middleware) com controle de permissões por role (`authorize` middleware)

## Arquitetura de dados (resumo)

```
usuarios ──┐
mesas ─────┼──▶ comandas ──▶ pedidos ──▶ itens_pedido ──▶ itens_cardapio
           │        (1 por mesa aberta)   (status: pendente/pronto/entregue)
```

- Uma **mesa** só pode ter **uma comanda aberta** por vez (constraint no banco).
- Uma **comanda** pode ter vários **pedidos** (rodadas de consumo).
- Cada **pedido** tem vários **itens**, e seu `status` percorre `pendente → pronto → entregue`, sincronizando as telas de Cozinha e Garçom sem comunicação direta entre elas — a única "ponte" entre as telas é o banco de dados, lido via polling.

## Permissões por perfil (role)

| Rota | admin | garcom | cozinha |
|---|---|---|---|
| `GET /mesas` | ✅ | ✅ | ❌ |
| `GET /comandas` | ✅ | ✅ | ✅ |
| `GET/POST /pedidos` | ✅ | ✅ | leitura |
| `PATCH /pedidos/:id/status` | ✅ | ✅ | ✅ |
| `GET /itens-pedido/:id` | ✅ | ✅ | ✅ |
| `POST /usuarios` | ✅ | ❌ | ❌ |
| `GET /relatorios/faturamento` | ✅ | ❌ | ❌ |

## Como rodar o projeto

### Back-end
```bash
cd cantinho-backend
npm install
# configure as variáveis de ambiente de conexão com o PostgreSQL
npm start
```

### Front-end
```bash
cd cantinho-app
npm install
npx expo start
```
Escaneie o QR code com o app **Expo Go** (SDK 56) no celular, ou rode num emulador Android/iOS.

> Configure o `BASE_URL` em `src/services/api.js` apontando pro IP local do back-end (mesma rede) ou pra URL de produção.

## Estrutura de pastas (front-end)

```
src/
├── components/       # componentes reutilizáveis (ex: BotaoHaptico)
├── contexts/         # AuthContext (sessão e role do usuário)
├── navigation/        # árvore de navegação por role
├── screens/
│   ├── admin/         # Dashboard, CriarUsuario, RelatorioFinanceiro
│   ├── login.js
│   ├── ListaMesas.js
│   ├── Comanda.js
│   └── Cozinha.js
└── services/          # api.js (camada de comunicação com o back-end), auth.js
```

## Estrutura de pastas (back-end)

```
servidor/
├── routes/            # mesas, comandas, pedidos, itensPedido, usuarios, login, relatorios
├── middlewares/        # auth (JWT), authorize (controle por role)
├── db.js
└── schema.js           # definição das tabelas
```

---

Projeto acadêmico/pessoal em desenvolvimento — feedbacks e sugestões são bem-vindos.

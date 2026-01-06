# Microsserviço de Notificações Push

Este é um microsserviço escalável construído com Nest.js, focado no envio de notificações push via Firebase Cloud Messaging (FCM). O projeto foi desenhado com princípios de Arquitetura Limpa e utiliza o padrão de projeto Observer para desacoplar as responsabilidades.

## Arquitetura e Padrão de Projeto

A arquitetura do projeto é modular e segue os princípios de separação de concerns.

- **`AppModule`**: O módulo raiz que integra todos os outros módulos.
- **`ConfigModule`**: Responsável por carregar e prover as variáveis de ambiente (como as credenciais do Firebase) de forma segura para toda a aplicação.
- **`FirebaseModule`**: Um módulo dedicado que encapsula a inicialização e configuração do SDK `firebase-admin`. Ele expõe um `FirebaseService` que pode ser injetado em outros serviços que precisam interagir com o Firebase.
- **`PushModule`**: Contém toda a lógica de negócio relacionada ao envio de notificações.

### Padrão de Projeto: Observer

O núcleo do design deste microsserviço é o **Padrão Observer**, implementado com o pacote `@nestjs/event-emitter`. Este padrão permite um baixo acoplamento entre os componentes do sistema.

O fluxo de operação é o seguinte:
1.  Um componente (neste caso, o `PushController`) recebe uma requisição para enviar uma notificação.
2.  Em vez de chamar diretamente o serviço de envio, o controller **emite um evento**, por exemplo, `notification.send`, contendo todos os dados necessários para o envio (token, título, mensagem, etc.).
3.  Um `PushListener` (o Observer) está "ouvindo" esse evento específico.
4.  Ao capturar o evento, o `PushListener` aciona o `PushService`, que contém a lógica de negócio para montar a mensagem e enviá-la através do Firebase.

Essa abordagem garante que o controller não precisa saber *como* a notificação é enviada, apenas que ele precisa *solicitar* um envio. Isso torna o sistema mais flexível e fácil de manter.

## Configuração do Ambiente

As credenciais do Firebase **não são versionadas** no Git por razões de segurança (o arquivo `.env` está no `.gitignore`). Para executar o projeto, você precisa configurar seu próprio ambiente local.

1.  **Copie o arquivo de exemplo:**
    ```bash
    cp .env.example .env
    ```

2.  **Preencha as variáveis no arquivo `.env`:**
    Você precisará do arquivo JSON da sua **Conta de Serviço (Service Account)** do Firebase. Abra o arquivo JSON e use os valores dele para preencher as seguintes variáveis no `.env`:

    - `FIREBASE_PROJECT_ID`: O valor do campo `project_id` do seu JSON.
    - `FIREBASE_CLIENT_EMAIL`: O valor do campo `client_email` do seu JSON.
    - `FIREBASE_PRIVATE_KEY`: Este é o passo mais importante. Copie o valor completo do campo `private_key` do seu JSON, incluindo o `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`. **Importante:** O `FirebaseService` já está preparado para formatar a chave, então você pode colar o valor exatamente como está no JSON.

    **Exemplo de `.env` preenchido:**
    ```env
    FIREBASE_PROJECT_ID="seu-projeto-id"
    FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@seu-projeto-id.iam.gserviceaccount.com"
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n........\n-----END PRIVATE KEY-----\n"
    ```

## Instalação e Execução

1.  **Instale as dependências:**
    ```bash
    npm install
    ```

2.  **Execute em modo de desenvolvimento:**
    O servidor iniciará na porta `3000` e recarregará automaticamente a cada alteração no código.
    ```bash
    npm run start:dev
    ```

## Uso da API de Teste

Para verificar o fluxo completo, há um endpoint de teste disponível.

- **Endpoint**: `POST /push/test`
- **Descrição**: Recebe os dados de uma notificação e dispara o evento interno para o envio.

**Corpo da Requisição (Request Body):**
O corpo da requisição deve ser um JSON com a seguinte estrutura:

```json
{
  "token": "aqui_vai_o_token_do_dispositivo_do_firebase",
  "title": "Título da Notificação",
  "message": "Corpo da mensagem que será exibida.",
  "data": {
    "customKey": "customValue",
    "outroDado": "123"
  }
}
```
- `token` (string, obrigatório): O token FCM do dispositivo que receberá a notificação.
- `title` (string, obrigatório): O título da notificação.
- `message` (string, obrigatório): O corpo principal da notificação.
- `data` (objeto, opcional): Um objeto com pares chave-valor para enviar dados adicionais (payload) junto com a notificação.

**Exemplo com cURL:**
```bash
curl --location 'http://localhost:3000/push/test' \
--header 'Content-Type: application/json' \
--data '{
    "token": "seu_device_token_aqui",
    "title": "Teste via API",
    "message": "Esta é uma mensagem de teste!",
    "data": {
        "screen": "HomePage"
    }
}'
```

## Como Criar um Novo Envio de Push (Integração)

A grande vantagem da arquitetura baseada em eventos é que **qualquer outro serviço** na sua aplicação pode disparar uma notificação sem precisar conhecer o `PushService` ou o `FirebaseService`.

Para enviar uma nova notificação de qualquer lugar da aplicação:

1.  **Injete o `EventEmitter2`** no construtor do seu serviço ou componente.
2.  **Emita o evento `notification.send`** com o payload esperado.

**Exemplo (dentro de um serviço hipotético `OrdersService`):**

```typescript
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OrdersService {
  constructor(private eventEmitter: EventEmitter2) {}

  async createOrder(orderData: any, userDeviceToken: string) {
    // ... sua lógica para criar um pedido ...

    // Após criar o pedido, emitir o evento para notificar o usuário
    this.eventEmitter.emit('notification.send', {
      deviceToken: userDeviceToken,
      title: 'Pedido Confirmado!',
      body: `Seu pedido #${orderData.id} foi confirmado e já está em preparação.`,
      data: {
        orderId: orderData.id,
        status: 'CONFIRMED'
      },
    });

    return { status: 'Order created and notification event emitted.' };
  }
}
```

O `PushListener` irá capturar este evento automaticamente e processar o envio, mantendo seu `OrdersService` completamente desacoplado da lógica de notificação.

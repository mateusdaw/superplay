/**
 * SUPERPLAY BRASIL — Assistente de IA (Netlify Function)
 * ------------------------------------------------------------
 * Esta função roda no servidor (não no navegador do cliente), então
 * a chave da IA e as chaves do QPanel ficam seguras.
 *
 * O QUE ELA FAZ:
 * 1) Recebe o histórico da conversa vindo do chat do site.
 * 2) Manda pra IA (Claude, da Anthropic) junto com um "manual" completo
 *    sobre a Superplay (planos, como instalar em cada dispositivo, etc).
 * 3) Se o cliente já passou nome + telefone e pediu o teste, a IA aciona
 *    a ferramenta "criar_teste_gratis", que essa função executa de
 *    verdade chamando a API do seu QPanel Sigma.
 * 4) Depois de criar o teste, salva os dados na planilha do Google
 *    (mesma que alimenta a página login.html) e devolve a resposta
 *    final da IA pro cliente.
 *
 * VARIÁVEIS DE AMBIENTE NECESSÁRIAS (configurar no Netlify em
 * Site settings > Environment variables):
 *
 *   ANTHROPIC_API_KEY   -> sua chave da API da Anthropic (console.anthropic.com)
 *   QPANEL_API_URL       -> URL da API do QPanel que cria o teste
 *                           (ex: https://supercore.sigma.vin/api/chatbot/XXXX/YYYY)
 *                           Não precisa de QPANEL_API_KEY separada: a autenticação
 *                           já está embutida nos códigos dentro da própria URL.
 *   RESEND_API_KEY       -> chave de API do Resend (resend.com/api-keys)
 *   RESEND_FROM_EMAIL     -> endereço verificado no Resend (ex: codigo@seudominio.com.br)
 *                           Precisa ser de um domínio JÁ VERIFICADO no Resend,
 *                           senão só funciona pro seu próprio e-mail de teste.
 *   SHEETS_API_URL        -> URL do Apps Script (/exec) já criado
 *   SHEETS_SECRET_TOKEN    -> mesmo token configurado no Apps Script
 *
 * ⚠️ ATENÇÃO: a função criarTesteNoQPanel() lá embaixo está com um
 * formato de exemplo (método, headers e corpo da requisição). Isso
 * PRECISA ser ajustado com os dados reais da sua API antes de funcionar
 * de verdade. Procure os comentários "TODO" abaixo.
 */

const ANTHROPIC_VERSION = '2023-06-01';
const MODEL = 'claude-haiku-4-5-20251001';

// ====== CONHECIMENTO DA IA SOBRE O NEGÓCIO ======
const SYSTEM_PROMPT = `
Você é o assistente de atendimento da Superplay Brasil, um serviço de streaming (IPTV).
Você conversa pelo chat do site, em português do Brasil, num tom simpático, direto e sem
formalidade excessiva. Use frases curtas.

## SEU OBJETIVO
1. Tirar dúvidas sobre os planos e sobre como instalar em cada dispositivo, usando
   SEMPRE as informações reais do site (seção "CONTEÚDO REAL DO SITE" abaixo) —
   nunca invente preço, prazo ou condição diferente do que está lá.
2. Quando o cliente demonstrar interesse em começar o teste grátis, colete o NOME
   completo e o TELEFONE/WHATSAPP (com DDD) dele. Não precisa verificar o telefone
   por código — é só pra identificação e contato.
3. Depois, peça o E-MAIL do cliente. Assim que tiver um e-mail válido, use a
   ferramenta "enviar_codigo_verificacao" pra mandar um código de 6 dígitos pra
   esse e-mail. Avise o cliente que um código chegou no e-mail e peça pra ele
   digitar aqui no chat (lembre de sugerir checar a caixa de spam/lixo eletrônico).
4. Quando o cliente digitar o código, use a ferramenta "verificar_codigo". Se der
   errado (código incorreto ou expirado), peça pra ele conferir e tentar de novo,
   ou ofereça mandar um novo código.
5. SÓ DEPOIS que "verificar_codigo" confirmar sucesso, use a ferramenta
   "criar_teste_gratis" (com nome, telefone, e-mail e dispositivo).
6. Depois que o teste for criado, explique ao cliente o passo a passo de instalação
   do dispositivo que ele escolheu, usando as instruções abaixo, e informe usuário,
   senha e servidor gerados.

## COMO FORMATAR SUAS RESPOSTAS (MUITO IMPORTANTE)
- Separe sua resposta em blocos curtos, cada um numa "caixinha" diferente — para
  isso, separe cada bloco com uma LINHA EM BRANCO entre eles (dois "enters"). Cada
  bloco vira uma bolha de chat separada na tela do cliente, então cada um deve
  fazer sentido sozinho (uma ideia por bloco), igual mensagens picadas de WhatsApp.
- Use **negrito** (com asteriscos duplos) em: nomes de aplicativos, nomes de botões
  ou opções que o cliente precisa clicar, e labels de campos (ex: **Usuário**,
  **Senha**, **DNS**, **URL do Servidor**, **Host**). Isso ajuda o cliente a achar
  rápido o que ele precisa preencher.
- Não escreva parágrafos longos. Prefira várias caixinhas curtas a uma só longa.

## PLANOS E PREÇOS
- Mensal — 2 telas — R$ 10,00/mês
- Mensal (mais popular) — 3 telas — R$ 19,00/mês
- Trimestral — 2 telas — R$ 50,00/3 meses (economia de R$ 7,00)
- Anual — 4 telas — R$ 90,00/ano (economia de R$ 138,00)
- Todos os planos: acesso ilimitado, qualidade HD/4K, sem fidelidade.

## TESTE GRÁTIS
- Duração: 24 HORAS.
- Sem necessidade de cartão de crédito.
- Após o período de teste, o valor mensal fica R$ 10,00 (plano de 2 telas).

## CONTEÚDO REAL DO SITE (use isso pra responder sobre planos, teste e pagamento)
Esta é a cópia exata publicada hoje no site da Superplay. Sempre que o cliente
perguntar como funciona, quanto custa, ou quiser assinar/pagar um plano, baseie
sua resposta neste conteúdo — não crie informação nova:

- Chamada principal: "Teste por 24 HORAS grátis!" — "Acesse o Superplay agora
  mesmo, sem compromisso. Clique no botão abaixo, entre no site e libere seu
  acesso de teste em poucos segundos." Abaixo do botão: "Sem cartão de crédito
  · Sem letras miúdas · Ativação imediata".
- Seção de recursos: "O conteúdo de várias plataformas em um único lugar! Tudo
  que você precisa para uma experiência completa de streaming" — com os
  destaques: Milhares de Canais (acesso a mais de 2 mil canais ao vivo e
  conteúdo on-demand), Segurança Garantida (dados protegidos com criptografia
  de ponta), Streaming Rápido (qualidade HD/4K com buffer mínimo) e Suporte
  24/7 (atendimento dedicado sempre que precisar).
- Seção "Planos e Preços" (a tabela oficial de planos do site):
  - Mensal, 2 telas, R$ 10,00/mês: acesso ilimitado, qualidade HD, 2 telas
    simultâneas, suporte pelo chat, sem fidelidade.
  - Mensal (selo "Mais Popular"), 3 telas, R$ 19,00/mês: acesso ilimitado,
    qualidade HD/4K, 3 telas simultâneas, suporte pelo chat, sem fidelidade.
  - Trimestral, 2 telas, R$ 50,00/3 meses: acesso ilimitado, qualidade HD/4K,
    2 telas simultâneas, suporte prioritário, economia de R$ 7,00.
  - Anual, 4 telas, R$ 90,00/ano: acesso ilimitado, qualidade HD/4K, 4 telas
    simultâneas, suporte VIP 24/7, economia de R$ 138,00.
  - Todos os botões de plano dizem "Assinar agora".
- Termos e Condições (texto oficial do site, use se o cliente perguntar):
  "Ao utilizar os serviços da Superplay, você concorda com os seguintes
  termos: O serviço é fornecido 'como está', garantindo estabilidade dentro
  das condições normais de internet. O compartilhamento de senhas é proibido
  e pode levar ao bloqueio da conta. Reembolsos são processados conforme a
  legislação vigente (7 dias para compras online)."
- Se o cliente quiser assinar um plano pago (não o teste grátis), explique
  os planos acima e diga que para confirmar a assinatura ele pode falar
  direto por aqui mesmo no chat, informando qual plano prefere — encaminhe
  a informação como se fosse continuar o atendimento humano depois.

## SEMPRE CHAME O CLIENTE PELO NOME
Assim que souber o nome do cliente, use o primeiro nome dele em boa parte das
suas mensagens daqui pra frente (não em todas, pra não ficar repetitivo, mas
com frequência) — isso deixa a conversa mais humana e menos robótica. Use
também emojis com moderação (📺 😊 👍 👇) pra deixar o tom leve, do jeito que
uma pessoa de verdade conversaria no WhatsApp.

## COMO INSTALAR EM CADA DISPOSITIVO
Depois que o teste for criado (ou se o cliente já tiver acesso existente),
pergunte em qual aparelho ele vai assistir (Smart TV, celular, TV Box,
Chromecast, PC...) antes de mandar o passo a passo. Sempre no formato de
blocos curtos (uma linha em branco entre cada ideia), com **negrito** nos
nomes de apps e labels de campos, e links sempre como URL pura (o próprio
chat transforma em link clicável).

Depois de mostrar os dados de acesso, uma mensagem no estilo:
"Me conta, em qual aparelho você vai assistir? (Smart TV, celular, TV Box,
Chromecast...) Assim já te passo o aplicativo certinho! 📺 😊"

E depois de mandar o link do app, sempre feche com algo como:
"Me avisa quando chegar aqui que eu te passo os dados! 👍"

Só revele usuário/senha/servidor DEPOIS que o cliente confirmar que já abriu
a tela de login do app (não precisa insistir demais nisso, mas siga essa
ordem: 1. manda o link do app → 2. espera confirmação → 3. manda os dados
de login formatados).

⚠️ MUITO IMPORTANTE — NUNCA INVENTE CREDENCIAIS:
Os valores de **DNS/Servidor**, **Usuário** e **Senha** que você mostra pro
cliente têm que ser EXATAMENTE os mesmos que vieram no resultado da
ferramenta "criar_teste_gratis" (campos "servidor", "usuario", "senha") —
copie esses valores literalmente, caractere por caractere. NUNCA gere,
adivinhe ou monte um valor parecido (nada de inventar algo tipo
"nome123456789" ou uma senha "123456" — isso está errado e confunde o
cliente). Se por algum motivo esses dados não estiverem disponíveis na
conversa, diga que vai verificar e chamar um atendente, mas não invente nada.

⚠️ NÃO CONFUNDA "LINK DO NAVEGADOR" COM "SERVIDOR/DNS":
- O link "http://core.webplayer.one/login" é APENAS um site que se abre no
  navegador (só usado no fluxo de Windows/Mac/PC). Ele NUNCA deve aparecer
  como se fosse o valor do campo "Servidor", "DNS" ou "Host" — são coisas
  diferentes.
- O campo **DNS / Servidor / Host** (usado dentro de QUALQUER app — XCIPTV,
  IPTV Smarters, 4K IPTV, XP IPTV, e também dentro do formulário de login do
  Webplayer) é sempre o valor real que veio da ferramenta (campo "servidor"),
  nunca o link do navegador.

**Android (celular/tablet) — app XCIPTV:**
Bloco 1: "Baixar o **XCIPTV** pelo Google Play:"
Bloco 2: "https://play.google.com/store/apps/details?id=com.nathnetwork.xciptv&pcampaignid=web_share"
Bloco 3: "Me avisa quando chegar aqui que eu te passo os dados! 👍"
(quando confirmar) Bloco: "Show! Agora preenche assim, nessa ordem 👇"
Bloco: "**DNS**: (servidor) **Usuário**: (usuário) **Senha**: (senha)"

**iPhone / iPad — app Smarters Player Lite:**
Bloco 1: "Baixar o **Smarters Player Lite** na App Store:"
Bloco 2: "https://apps.apple.com/br/app/smarters-player-lite/id1628995509"
Bloco 3: "(É o mesmo IPTV Smarters, só que pra Apple.)"
Bloco 4: "Abra o app e clique em \\"ENTRAR COM API DE CÓDIGOS XTREAM\\" — vai abrir a tela de login"
Bloco 5: "Me avisa quando chegar aqui que te passo os dados! 👍"
(quando confirmar) Bloco: "Show! Agora preenche assim, nessa ordem 👇"
Bloco: "**Primeira linha**: qualquer nome **DNS / URL do Servidor**: (servidor) **Usuário**: (usuário) **Senha**: (senha)"

**TV Box — app XP IPTV:**
Bloco 1: "Baixar o **XP IPTV** pelo navegador do TV Box (Google Chrome):"
Bloco 2: "Entra no navegador e coloca esse link na barra de pesquisa:"
Bloco 3: "https://oficialdezpilas.com.br/app3.apk"
Bloco 4: "Depois é só seguir os mesmos passos do IPTV Smarters: abre o app, clica em \\"ENTRAR COM API DE CÓDIGOS XTREAM\\", e me avisa quando chegar na tela de login! 👍"
(quando confirmar) Bloco: "Show! Agora preenche assim, nessa ordem 👇"
Bloco: "**DNS**: (servidor) **Usuário**: (usuário) **Senha**: (senha)"

**TV Android / Philips / TCL / Philco (Smart TV com loja de apps) — app IPTV Smarters:**
Bloco 1: "Entre na loja de aplicativos da sua TV e pesquise por \\"**Downloader by AFT**\\""
Bloco 2: "Depois de baixado, na área de \\"**Enter URL**\\" do app você coloca o número **5219138** e depois aperta em \\"**Go**\\""
Bloco 3: "Isso baixa o **IPTV Smarters**. Abre o app, clica em \\"ENTRAR COM API DE CÓDIGOS XTREAM\\", e me avisa quando chegar na tela de login! 👍"
(quando confirmar) Bloco: "Show! Agora preenche assim, nessa ordem 👇"
Bloco: "**Primeira linha**: qualquer nome **DNS / URL do Servidor**: (servidor) **Usuário**: (usuário) **Senha**: (senha)"

**Windows / Mac / PC / Notebook (Webplayer, sem precisar instalar nada):**
Bloco 1: "No computador é bem simples, sem precisar instalar nada:"
Bloco 2: "http://core.webplayer.one/login"
Bloco 3: "Abre esse link no navegador (isso é só o site, não é o servidor), e na tela de login coloca assim, nessa ordem 👇"
Bloco: "**DNS**: (servidor) **Usuário**: (usuário) **Senha**: (senha)"

**Samsung / LG / Roku — app 4K IPTV:**
Bloco 1: "Baixe o app **4K IPTV** na loja de aplicativos da sua TV"
Bloco 2: "Depois, clique em **Xtream Account**, e preencha os seguintes dados pra acessar, nessa ordem:"
Bloco: "**Host**: (servidor) **Usuário**: (usuário) **Senha**: (senha)"

(Em todos os casos, "(servidor)", "(usuário)" e "(senha)" são os valores
EXATOS devolvidos pela ferramenta "criar_teste_gratis" — nunca invente ou
altere esses valores.)

## FOTOS DISPONÍVEIS
Por padrão, NÃO envie fotos/imagens — passe apenas as informações em texto,
como descrito acima. Só use uma foto se ela estiver explicitamente na lista
abaixo:

(nenhuma foto cadastrada até o momento — adicione aqui no formato
![descrição](URL) se quiser habilitar fotos no futuro)

Nunca use uma URL de foto que não esteja nesta lista.

## QUANDO O TELEFONE JÁ TEM ACESSO
Depois de chamar "criar_teste_gratis", o resultado pode vir com "jaExistia": true.
Isso significa que esse telefone JÁ pediu teste antes — NÃO foi criado um teste
novo. Nesse caso, avise o cliente com clareza que ele já tem um acesso ativo
(não diga "seu teste foi criado agora"), e mostre os dados de acesso que já
existem (usuário, senha, servidor). Se ele disser que quer um teste novo mesmo
assim, explique que por telefone já usado não é possível gerar outro, e
ofereça encaminhar pra um atendente humano ou sugerir assinar um plano pago.

## REGRAS IMPORTANTES
- Nunca invente informação que não está aqui. Se não souber algo, diga que vai
  chamar um atendente humano.
- Nunca peça dados de pagamento (cartão, etc) — o teste é 100% grátis.
- Sempre confirme nome e telefone com o cliente antes de chamar a ferramenta
  de criar o teste.
- Depois de criar o teste, sempre mostre usuário, senha e servidor com clareza,
  cada informação em negrito, seguindo o formato de instalação do dispositivo
  escolhido.
`;

// ====== FERRAMENTA QUE A IA PODE CHAMAR ======
const TOOLS = [
  {
    name: 'enviar_codigo_verificacao',
    description:
      'Gera um código de 6 dígitos e envia por E-MAIL pro cliente, pra confirmar que o e-mail é real. Use isso ANTES de criar o teste, assim que o cliente informar um e-mail válido (depois de já ter nome e telefone).',
    input_schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'E-mail do cliente, onde o código de verificação será enviado',
        },
      },
      required: ['email'],
    },
  },
  {
    name: 'verificar_codigo',
    description:
      'Confirma se o código de 6 dígitos que o cliente digitou está correto. Use depois de "enviar_codigo_verificacao", quando o cliente informar o código recebido no e-mail.',
    input_schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Mesmo e-mail usado no envio do código',
        },
        codigo: {
          type: 'string',
          description: 'Código de 6 dígitos que o cliente digitou',
        },
      },
      required: ['email', 'codigo'],
    },
  },
  {
    name: 'criar_teste_gratis',
    description:
      'Cria o acesso de teste grátis do cliente no painel QPanel Sigma. Só use depois de já ter nome, telefone e e-mail confirmados, E depois que "verificar_codigo" retornar sucesso.',
    input_schema: {
      type: 'object',
      properties: {
        nome: { type: 'string', description: 'Nome completo do cliente' },
        whatsapp: {
          type: 'string',
          description: 'Telefone/WhatsApp do cliente com DDD, apenas números',
        },
        email: {
          type: 'string',
          description: 'E-mail do cliente, já verificado por código',
        },
        dispositivo: {
          type: 'string',
          description:
            'Dispositivo que o cliente vai usar: android, iphone, tv_android, windows ou samsung_lg_roku',
        },
      },
      required: ['nome', 'whatsapp', 'email'],
    },
  },
];

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { messages } = JSON.parse(event.body);
    console.log('📩 Mensagens recebidas:', JSON.stringify(messages).slice(0, 500));

    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('❌ ANTHROPIC_API_KEY não configurada');
      return {
        statusCode: 500,
        body: JSON.stringify({
          error:
            'ANTHROPIC_API_KEY não configurada nas variáveis de ambiente do Netlify.',
        }),
      };
    }

    let response = await callClaude(messages);
    console.log('🤖 stop_reason:', response.stop_reason);

    // Enquanto a IA quiser usar uma ferramenta, executamos e devolvemos o resultado pra ela
    while (response.stop_reason === 'tool_use') {
      const toolUseBlock = response.content.find((b) => b.type === 'tool_use');
      console.log('🔧 IA chamou a ferramenta:', toolUseBlock.name, JSON.stringify(toolUseBlock.input));
      let toolResult;

      if (toolUseBlock.name === 'enviar_codigo_verificacao') {
        toolResult = await enviarCodigoVerificacao(toolUseBlock.input);
        console.log('📦 Resultado do enviar_codigo_verificacao:', JSON.stringify(toolResult));
      } else if (toolUseBlock.name === 'verificar_codigo') {
        toolResult = await verificarCodigo(toolUseBlock.input);
        console.log('📦 Resultado do verificar_codigo:', JSON.stringify(toolResult));
      } else if (toolUseBlock.name === 'criar_teste_gratis') {
        toolResult = await criarTesteNoQPanel(toolUseBlock.input);
        console.log('📦 Resultado do criar_teste_gratis:', JSON.stringify(toolResult));
      } else {
        toolResult = { ok: false, error: 'Ferramenta desconhecida' };
      }

      messages.push({ role: 'assistant', content: response.content });
      messages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUseBlock.id,
            content: JSON.stringify(toolResult),
          },
        ],
      });

      response = await callClaude(messages);
      console.log('🤖 stop_reason (após tool):', response.stop_reason);
    }

    const textBlock = response.content.find((b) => b.type === 'text');
    console.log('💬 Resposta final da IA:', textBlock ? textBlock.text.slice(0, 300) : '(vazia)');

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: textBlock ? textBlock.text : '' }),
    };
  } catch (err) {
    console.log('💥 ERRO GERAL:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// ====== CHAMADA PRA API DA ANTHROPIC (CLAUDE) ======
async function callClaude(messages) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Erro na API da Anthropic: ${resp.status} ${errText}`);
  }

  return resp.json();
}

// ====== CHAMADA REAL PRA API DO QPANEL SIGMA ======
// ====== ENVIA UM CÓDIGO DE VERIFICAÇÃO POR WHATSAPP (via BotBot.Chat) ======
async function enviarCodigoVerificacao({ email }) {
  const codigo = String(Math.floor(100000 + Math.random() * 900000)); // 6 dígitos
  const expiraEm = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutos

  // 1) Salva o código na planilha (pra depois conferir) — usa o e-mail como chave
  if (process.env.SHEETS_API_URL && process.env.SHEETS_SECRET_TOKEN) {
    try {
      await fetch(process.env.SHEETS_API_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: process.env.SHEETS_SECRET_TOKEN,
          action: 'salvar_otp',
          email,
          codigo,
          expiraEm,
        }),
      });
    } catch (e) {
      console.log('💥 Falha ao salvar código OTP na planilha:', e.message);
      return { ok: false, error: 'Não consegui gerar o código agora. Tenta de novo.' };
    }
  } else {
    return { ok: false, error: 'Planilha não configurada (SHEETS_API_URL/SHEETS_SECRET_TOKEN).' };
  }

  // 2) Manda o código de verdade por e-mail via Resend
  // Endpoint: POST https://api.resend.com/emails
  // ⚠️ RESEND_FROM_EMAIL precisa ser um endereço de um domínio JÁ VERIFICADO
  // no Resend (ex: codigo@seudominio.com.br). Sem domínio verificado, o
  // Resend só permite mandar pro próprio e-mail da conta (não pra clientes).
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL,
          to: [email],
          subject: 'Seu código de verificação Superplay',
          html: `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f2;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(90deg,#5c0000,#ff1f1f);padding:22px 24px;text-align:center;">
            <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:0.5px;">📺 SUPERPLAY BRASIL</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 24px;text-align:center;">
            <p style="margin:0 0 6px;font-size:16px;color:#111111;font-weight:700;">Confirme seu e-mail</p>
            <p style="margin:0 0 24px;font-size:14px;color:#666666;">Use o código abaixo para confirmar seu acesso ao teste grátis:</p>
            <div style="display:inline-block;background:#fdeaea;border:2px solid #ff1f1f;border-radius:12px;padding:16px 32px;margin-bottom:20px;">
              <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#e50000;">${codigo}</span>
            </div>
            <p style="margin:0;font-size:13px;color:#999999;">⏱️ Válido por 5 minutos. Se você não pediu esse código, pode ignorar este e-mail.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 24px;background:#fafafa;border-top:1px solid #eeeeee;text-align:center;">
            <span style="font-size:12px;color:#999999;">— Equipe Superplay Brasil</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`,
        }),
      });
      const respText = await resp.text();
      console.log('📥 Status HTTP do envio Resend:', resp.status, respText.slice(0, 300));

      if (!resp.ok) {
        return { ok: false, error: 'Não consegui enviar o código por e-mail agora.' };
      }
    } catch (e) {
      console.log('💥 Falha ao enviar e-mail via Resend:', e.message);
      return { ok: false, error: 'Não consegui enviar o código por e-mail agora.' };
    }
  } else {
    console.log('⚠️ RESEND_API_KEY/RESEND_FROM_EMAIL não configuradas — código não foi enviado de verdade');
    return {
      ok: false,
      error: 'Envio por e-mail não configurado ainda (faltam as variáveis do Resend).',
    };
  }

  return { ok: true };
}

// ====== VERIFICA O CÓDIGO DIGITADO PELO CLIENTE ======
async function verificarCodigo({ email, codigo }) {
  if (!process.env.SHEETS_API_URL || !process.env.SHEETS_SECRET_TOKEN) {
    return { ok: false, error: 'Planilha não configurada.' };
  }

  try {
    const resp = await fetch(process.env.SHEETS_API_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        token: process.env.SHEETS_SECRET_TOKEN,
        action: 'verificar_otp',
        email,
        codigo,
      }),
    });
    const data = await resp.json();
    return data;
  } catch (e) {
    return { ok: false, error: 'Não consegui verificar o código agora. Tenta de novo.' };
  }
}

async function criarTesteNoQPanel({ nome, whatsapp, email, dispositivo }) {
  // ====== 1) VERIFICA SE ESSE TELEFONE JÁ TEM ACESSO SALVO ======
  // Antes de criar um teste novo, olha na planilha se esse número já pediu
  // teste antes. Se já existir, devolve o acesso existente em vez de criar
  // um novo (evita o cliente gerar testes infinitos trocando nada além do nome).
  if (process.env.SHEETS_API_URL) {
    try {
      const checkResp = await fetch(
        `${process.env.SHEETS_API_URL}?telefone=${encodeURIComponent(whatsapp)}`
      );
      const checkData = await checkResp.json();
      console.log('🔎 Verificação de telefone existente:', JSON.stringify(checkData));

      // Só considera "já existe" se a linha tiver os campos essenciais preenchidos.
      // Linhas gravadas com dados incompletos (usuário/senha/servidor vazios)
      // não bloqueiam o telefone — deixamos criar um novo acesso.
      if (checkData.ok && checkData.usuario && checkData.senha && checkData.servidor) {
        return {
          ok: true,
          jaExistia: true,
          usuario: checkData.usuario,
          senha: checkData.senha,
          servidor: checkData.servidor,
          validade: checkData.expira || null,
          nome: checkData.nome || nome,
          email: checkData.email || email,
        };
      }
    } catch (e) {
      console.log('⚠️ Falha ao verificar telefone existente (seguindo pra criar):', e.message);
    }
  }

  // ====== 2) SE NÃO EXISTIA, CRIA UM TESTE NOVO NO QPANEL ======
  // Formato descoberto a partir do bloco de HTTP Request do Typebot:
  // - Method: POST
  // - Sem headers customizados (a autenticação está embutida na própria URL)
  // - Sem "custom body" no Typebot, ou seja, ele manda o "snapshot" das
  //   variáveis já coletadas no fluxo (nome, whatsapp, dispositivo).
  // - Resposta vem com: data.username, data.password, data.dns,
  //   data.expirestAtFormatted, data.package, data.reply

  const QPANEL_URL = process.env.QPANEL_API_URL;
  console.log('🌐 QPANEL_API_URL configurada?', !!QPANEL_URL);

  if (!QPANEL_URL) {
    return {
      ok: false,
      error:
        'QPANEL_API_URL não configurada. Peça pro administrador do site configurar essa variável de ambiente.',
    };
  }

  console.log('📤 Chamando QPanel com:', JSON.stringify({ nome, whatsapp, dispositivo }));

  const resp = await fetch(QPANEL_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      nome,
      whatsapp,
      dispositivo,
    }),
  });

  console.log('📥 Status HTTP da resposta do QPanel:', resp.status);

  const rawText = await resp.text();
  console.log('📥 Corpo bruto da resposta do QPanel:', rawText.slice(0, 800));

  let data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    console.log('💥 Resposta do QPanel não é JSON válido');
    return { ok: false, error: 'Resposta inesperada do QPanel: ' + rawText.slice(0, 200) };
  }

  if (!resp.ok) {
    return { ok: false, error: 'QPanel retornou erro HTTP ' + resp.status };
  }

  // QPanel pode usar "dns" ou "servidor" dependendo da versão — aceita os dois
  const acesso = {
    ok: true,
    usuario: data.username || data.usuario,
    senha: data.password || data.senha,
    servidor: data.dns || data.servidor,
    validade: data.expirestAtFormatted || '24 horas',
    pacote: data.package,
  };

  console.log('✅ Acesso montado:', JSON.stringify(acesso));

  // Valida que os campos essenciais vieram do QPanel antes de tentar salvar.
  // Se estiverem ausentes, JSON.stringify os omitiria silenciosamente e a
  // planilha ficaria com uma linha vazia (bloqueando o telefone para sempre).
  if (!acesso.usuario || !acesso.senha || !acesso.servidor) {
    console.log('⚠️ QPanel retornou campos incompletos — não salvando linha vazia na planilha. Resposta bruta:', rawText.slice(0, 400));
    return {
      ok: false,
      error: 'Não foi possível gerar o acesso agora (dados incompletos do servidor). Tente novamente em instantes.',
    };
  }

  // Salva na planilha (Google Sheets) pra alimentar a página login.html
  if (process.env.SHEETS_API_URL && process.env.SHEETS_SECRET_TOKEN) {
    console.log('📤 Salvando na planilha...');
    try {
      const sheetPayload = JSON.stringify({
        token: process.env.SHEETS_SECRET_TOKEN,
        telefone: whatsapp,
        nome,
        email,
        usuario: acesso.usuario,
        senha: acesso.senha,
        // envia "servidor" E "dns" para compatibilidade com qualquer versão do Apps Script
        servidor: acesso.servidor,
        dns: acesso.servidor,
        expira: acesso.validade,
      });
      console.log('📤 Payload para planilha (sem token):', sheetPayload.replace(/"token":"[^"]*"/, '"token":"[REDACTED]"').slice(0, 400));

      const sheetResp = await fetch(process.env.SHEETS_API_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: sheetPayload,
      });
      const sheetText = await sheetResp.text();
      console.log('📥 Resposta da planilha (status', sheetResp.status, '):', sheetText.slice(0, 500));
      if (!sheetResp.ok || sheetText.includes('"ok":false')) {
        console.log('⚠️ Planilha retornou erro — o acesso foi criado mas pode não ter sido salvo.');
      }
    } catch (e) {
      // Não bloqueia o fluxo do cliente se a planilha falhar — só loga.
      console.log('💥 Falha ao salvar na planilha:', e.message);
    }
  } else {
    console.log('⚠️ SHEETS_API_URL ou SHEETS_SECRET_TOKEN não configuradas — pulando salvamento na planilha');
  }

  return acesso;
}

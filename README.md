# Preço de Disco

Lista de consulta de preços de vinil, radar de leilões e procuras do Márcio.

## Publicação na Vercel

O projeto usa Next.js e pode ser publicado diretamente na Vercel.

1. Conecte o projeto a uma conta Vercel.
2. Em **Storage**, crie e conecte um **Vercel Blob privado**. A Vercel adicionará `BLOB_READ_WRITE_TOKEN` ao projeto.
3. Em **Settings > Environment Variables**, crie `SITE_PASSWORD` com a senha compartilhada.
4. Faça uma nova publicação para que as variáveis entrem em vigor.

A senha protege o site inteiro e também autoriza a edição da tabela. A sessão fica salva no navegador por 30 dias. As alterações feitas nas células são gravadas em `catalog/catalog-edits.json` no Blob; mudar preços não exige uma nova publicação.

## Desenvolvimento local

Crie `.env.local` com:

```dotenv
SITE_PASSWORD=sua-senha
BLOB_READ_WRITE_TOKEN=token-do-blob
```

Depois execute:

```bash
npm install
npm run dev
```

Para baixar as variáveis de um projeto Vercel já conectado, também é possível usar `vercel env pull`.

## Verificação

```bash
npm run lint
npm test
```

O teste cria o catálogo público, compila o site, valida a tela e confirma o bloqueio por senha.

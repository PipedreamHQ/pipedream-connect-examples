# Pipedream Components Demo (React)

## Clone this Next.js demo app

```sh
% git clone https://github.com/PipedreamHQ/pipedream-connect-examples.git
% cd connect-react-demo
```

## Install dependencies

```sh
% pnpm install
```

## Create necessary Pipedream resources

1. A [Pipedream account](https://pipedream.com) and [workspace](https://pipedream.com/docs/workspaces)
2. A [Pipedream API OAuth client](https://pipedream.com/docs/rest-api/auth#creating-an-oauth-client)
3. Your [project's ID](https://pipedream.com/docs/projects#finding-your-projects-id)

## Set your environment variables

Copy the `.env.example` file to `.env.local` and fill in the values.

```
cp .env.example .env.local
```

## Run the app

```sh
% pnpm dev
```
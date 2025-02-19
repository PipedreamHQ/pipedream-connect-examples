# Pipedream Components Demo (React)

## Clone this Next.js demo app

```sh
git clone https://github.com/PipedreamHQ/pipedream-connect-examples.git
cd connect-react-demo
```

## Install dependencies

```sh
pnpm install
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
pnpm dev
```


## How to test @pipedream/connecct-react changes with this app

clone this repo as well as the the repo that contains connect-react (pipedream).
Make sure the two repos are cloned in the same parent directory

```sh
git clone https://github.com/PipedreamHQ/pipedream-connect-examples.git
git clone https://github.com/PipedreamHQ/pipedream.git
```

Install dependencies and build connect-react.  Using watch will rebuild the package when changes are detected.

```sh
cd pipedream/packages/connect-react
pnpm install
pnpm watch
```

In a separate tab install dependencies and run the demo app.  Be sure to set the correct values in .env.local

```sh
cd pipedream-connect-examples/connect-react-demo
cp .env.example .env.local
make connect-react-dev
```

Changes made in connect-react will not be automatically loaded by the app.  To pick them up you'll need to restart `make connect-react-dev`

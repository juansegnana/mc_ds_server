# MC Server Controller Discord Bot

Made with TS, Discord.js

## Commands

Install dependencies

```bash
yarn install
# make sure you have typescript as global dependency
# use Node>=16 !
```

Run develop: this uses `nodemon` to watch for changes and restart the bot

```bash
yarn start:dev
```

Build for production: creates an `build` folder with `.js` files

```bash
yarn build
```

Refresh slash commands in Server: This must be run in a personal environment. Just run it whenever you add/edit a slash command.

```bash
yarn refresh:slash
```

**Date started**: 2022-12-08

Docs reference: https://dashflo.net/docs/api/pterodactyl/v1/#req_395b45b3381643ebaed7ee23a9a356f3
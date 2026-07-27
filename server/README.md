# PNG export server

Stateless render service used only for the "PNG letöltése" buttons in the editor. It has
no database, no accounts, and saves nothing — each request sends the already-generated
embed HTML, gets a PNG back, and that's it.

## Run

```
cd server
npm install
npm start
```

Listens on `http://localhost:4000` by default (override with `PORT`). The frontend
(`src/utils/pngExport.js`) expects it at that address during local development.

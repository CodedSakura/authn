import connectLiveReload from "connect-livereload";
import express, { Request, Response } from "express";
import { create } from "express-handlebars";
import livereload from "livereload";
import fs from "node:fs";
import type { AddressInfo } from "node:net";
import path from "node:path";
import qs from "qs";
import sass from "sass";
import login from "./login";


export const basePath = ("/" + (process.env.BASE_PATH ?? "")
      .replace(/\/$/, "")
      .replace(/^\//, "") + "/").replace(/^\/\/$/, "/");

const liveReloadServer = livereload.createServer();
liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  });
});

const app = express();

const hbs = create({
  helpers: {
    eq: (a: any, b: any) => a == b,
    path: (p: any) => path.join(basePath, p),
  },
});

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", path.resolve(__dirname, "../views"));

app.set("query parser", (str: string) => {
  return qs.parse(str);
});

app.use(connectLiveReload());

login(app);

app.get(path.join(basePath, "*.css"), (req: Request, res: Response) => {
  const urlBase = path.dirname(path.relative(path.join(basePath, "/"), req.url));
  const filename = path.basename(req.url, ".css");
  const extLessPath = path.resolve(__dirname, "../public", urlBase, filename);
  if (fs.existsSync(extLessPath + ".css")) {
    res.sendFile(extLessPath + ".css");
    return;
  } else if (fs.existsSync(extLessPath + ".sass")) {
    res.set("Content-Type", "text/css");
    res.send(sass.compile(extLessPath + ".sass").css);
    return;
  } else if (fs.existsSync(extLessPath + ".scss")) {
    res.set("Content-Type", "text/css");
    res.send(sass.compile(extLessPath + ".scss").css);
    return;
  }
  res.sendStatus(404);
});

app.use(path.join(basePath, "/"), express.static(path.resolve(__dirname, "../public")));

const listener = app.listen(Number(process.env.PORT ?? 3000), () => {
  const address = listener.address()! as AddressInfo;
  console.log(`App started on ${address.port}, base path = '${basePath}'`);
});

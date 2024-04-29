import connectLiveReload from "connect-livereload";
import connectPG from "connect-pg-simple";
import cookieParser from "cookie-parser";
import express, { Request, Response } from "express";
import { create } from "express-handlebars";
import session from "express-session";
import livereload from "livereload";
import cron from "node-cron";
import fs from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import path from "node:path";
import pg from "pg";
import qs from "qs";
import sass from "sass";
import dash from "./dash";
import { deleteExpired } from "./db";
import login from "./login";


declare module 'express-session' {
  export interface SessionData {
    csrf?: string;
    user?: string;
    forward?: any;
  }
}


if (!process.env.SECRET_COOKIE || !process.env.SECRET_SESSION) {
  console.error("provide both SECRET_COOKIE and SECRET_SESSION");
  process.exit(1);
}


export const basePath = ("/" + (process.env.BASE_PATH ?? "")
      .replace(/\/$/, "")
      .replace(/^\//, "") + "/").replace(/^\/\/$/, "/");
export const baseUrl = process.env.BASE_URL ?? ("http://localhost:" + process.env.PORT);
export const getFullURL = (p: string) => new URL(path.join(basePath, p), baseUrl).href;

const app = express();


export const postgres = new pg.Client({
  user: "postgres",
  password: "postgres",
  host: process.env.POSTGRES_HOST ?? "localhost",
});
postgres.connect()
      .then(async () => {
        let runMigrationsFromExcl = await postgres
              .query("SELECT version FROM migrations")
              .then(
                    r => r.rows[0].version,
                    () => "0000-00-00_00",
              );

        const migrations = (await readdir(path.join(__dirname, "../migrations")))
              .filter(v => v > `${runMigrationsFromExcl}.sql`)
              .map(v => path.join(__dirname, "../migrations", v));

        for (const file of migrations) {
          console.log(`running migration ${file}`);
          await postgres.query(await readFile(file, "utf-8"));
        }
        if (migrations.length > 0) {
          console.log("migrations done");
        }
      }, console.error);


const hbs = create({
  helpers: {
    eq: (a: any, b: any) => a == b,
    path: getFullURL,
    fmtDate: (date: any) => date ? new Intl.DateTimeFormat("se-SV", {
      dateStyle: "short",
    }).format(new Date(date)) : null,
    join: (l: any[], j: any) => l.join(j),
  },
});

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", path.resolve(__dirname, "../views"));

app.set("query parser", (str: string) => {
  return qs.parse(str);
});


const liveReloadServer = livereload.createServer();
liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  });
});

app.use(connectLiveReload());


app.set("trust proxy", 1);

app.use(express.urlencoded({ extended: false }));

app.use(cookieParser(process.env.SECRET_COOKIE));

app.use(session({
  secret: process.env.SECRET_SESSION as string,
  resave: false,
  saveUninitialized: false,
  name: "session",
  store: new (connectPG(session))({
    pool: new pg.Pool({
      user: "postgres",
      password: "postgres",
      host: process.env.POSTGRES_HOST ?? "localhost",
    }),
  }),
}));


login(app);

dash(app);


app.get(path.join(basePath, "*.css"), (req: Request, res: Response) => {
  const urlBase = path.dirname(path.relative(path.join(basePath, "/"), req.url));
  const filename = path.basename(req.url, ".css");
  const extLessPath = path.resolve(__dirname, "../public", urlBase, filename);
  if (fs.existsSync(extLessPath + ".css")) {
    res.set("Content-Type", "text/css")
          .sendFile(extLessPath + ".css");
    return;
  } else if (fs.existsSync(extLessPath + ".sass")) {
    res.set("Content-Type", "text/css")
          .send(sass.compile(extLessPath + ".sass").css);
    return;
  } else if (fs.existsSync(extLessPath + ".scss")) {
    res.set("Content-Type", "text/css")
          .send(sass.compile(extLessPath + ".scss").css);
    return;
  }
  res.sendStatus(404);
});

app.use(path.join(basePath, "/"), express.static(path.resolve(__dirname, "../public")));


const listener = app.listen(Number(process.env.PORT ?? 80), () => {
  const address = listener.address()! as AddressInfo;
  console.log(`App started on ${address.port}, full path = '${getFullURL("/")}'`);
});


// default: once every hour
cron.schedule(process.env.CRON ?? "0 * * * *", deleteExpired);

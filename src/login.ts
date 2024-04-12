import bcrypt from "bcrypt";
import type { Express, Request, Response } from "express";
import path from "node:path";
import { createUser, delCode, getCode, getUser } from "./db";
import { basePath } from "./index";

export default function (app: Express) {
  app.get(path.join(basePath, "/"), async (req: Request, res: Response) => {
    const perms = (req.query.perms as string ?? "").split(";");

    if (req.session.user) {
      const user = await getUser(req.session.user);
      console.log(user);
      if (perms.every(p => user.perms.includes(p))) {
        res.sendStatus(200);
        return;
      }
    }

    if (!req.session.csrf) {
      req.session.csrf = crypto.randomUUID();
    }

    res.status(401).render("login", {
      title: "login",
      csrf: req.session.csrf,
      perms: perms.join(", "),
    });
  });

  app.post(path.join(basePath, "/"), async (req: Request, res: Response) => {
    const { username, password, csrf } = req.body;

    const user = await getUser(username).catch(() => false);
    let success =
          user &&
          csrf === req.session.csrf &&
          await bcrypt.compare(password, user.password);

    if (success) {
      req.session.user = username;
      res.sendStatus(200);
      return;
    }

    if (!req.session.csrf) {
      req.session.csrf = crypto.randomUUID();
    }

    res.status(403).render("login", {
      title: "login",
      csrf: req.session.csrf,
      error: "invalid username or password",
    });
  });


  app.get(path.join(basePath, "/register"), (req: Request, res: Response) => {
    if (!req.session.csrf) {
      req.session.csrf = crypto.randomUUID();
    }

    res.status(401).render("register", {
      title: "register",
      csrf: req.session.csrf,
    });
  });

  app.post(path.join(basePath, "/register"), async (req: Request, res: Response) => {
    const { username, password, csrf, code } = req.body;

    const usernameFree = await getUser(username)
          .then(() => false, () => true);

    const codeDb = await getCode(code).catch(() => false);

    let error: string | false = false;
    if (!usernameFree) {
      error = "username taken";
    } else if (!codeDb) {
      error = "invalid code";
    } else if (password.length < 8 || password.length > 128) {
      error = "bad password";
    } else if (csrf !== req.session.csrf) {
      error = "csrf invalid";
    }

    if (!req.session.csrf) {
      req.session.csrf = crypto.randomUUID();
    }

    if (error) {
      res.status(403).render("register", {
        title: "register",
        csrf: req.session.csrf,
        error: error,
      });
      return;
    }

    await createUser(username, await bcrypt.hash(password, 12), codeDb.perms);
    await delCode(codeDb.code);

    res.sendStatus(200);
  });


  app.get(path.join(basePath, "/reset"), (req: Request, res: Response) => {
    if (!req.session.csrf) {
      req.session.csrf = crypto.randomUUID();
    }

    res.status(401).render("reset", {
      title: "password reset",
      csrf: req.session.csrf,
    });
  });

  app.post(path.join(basePath, "/reset"), async (req: Request, res: Response) => {
    res.sendStatus(401);
  });
}

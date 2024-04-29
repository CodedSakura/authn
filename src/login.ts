import bcrypt from "bcrypt";
import type { Express, Request, Response } from "express";
import crypto from "node:crypto";
import path from "node:path";
import { changeUserPass, createUser, delCode, getCode, getUser, resetUserPass } from "./db";
import { basePath, getFullURL } from "./index";

export default function (app: Express) {
  app.get(path.join(basePath, "/"), async (req: Request, res: Response) => {
    const perms = (req.query.perms as string ?? "").split(";")
          .filter(v => v);

    if (req.session.user) {
      const user = await getUser(req.session.user);
      if (perms.every(p => user.perms.includes(p))) {
        res.sendStatus(200);
        return;
      }
    }

    if (!req.session.csrf) {
      req.session.csrf = crypto.randomUUID();
    }

    req.session.forward = req.get("X-Forwarded-Uri");

    res.status(401).render("login", {
      title: "login",
      csrf: req.session.csrf,
      perms: perms.join(", "),
    });
  });

  app.post(path.join(basePath, "/"), async (req: Request, res: Response) => {
    const { username, password, csrf, remember } = req.body;

    const user = await getUser(username).catch(() => false);
    let success =
          user &&
          // csrf === req.session.csrf &&
          await bcrypt.compare(password, user.password);

    if (success) {
      req.session.cookie.maxAge = remember ? 365 * 24 * 60 * 60 * 1000 : undefined;
      req.session.user = username;

      if (req.session.forward) {
        res.redirect(req.session.forward);
      } else {
        res.sendStatus(200);
      }

      return;
    }

    if (!req.session.csrf) {
      req.session.csrf = crypto.randomUUID();
    }

    res.status(400).render("login", {
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

    const user = await getUser(username)
          .catch(() => false);

    let error: string | false = false;
    if (user && user.passReset) {
      if (!code !== user.resetCode) {
        error = "invalid code";
      } else if (password.length < 8 || password.length > 128) {
        error = "bad password";
      } else if (csrf !== req.session.csrf) {
        error = "csrf invalid";
      }

      if (!error) {
        await changeUserPass(username, await bcrypt.hash(password, 12));

        res.redirect(getFullURL("/login"));
        return;
      }
    } else {
      const codeDb = await getCode(code).catch(() => false);

      if (user) {
        error = "username taken";
      } else if (!codeDb) {
        error = "invalid code";
      } else if (password.length < 8 || password.length > 128) {
        error = "bad password";
      } else if (csrf !== req.session.csrf) {
        error = "csrf invalid";
      }

      if (!error) {
        await createUser(username, await bcrypt.hash(password, 12), codeDb.perms, codeDb.expires ?? null);
        await delCode(codeDb.code);

        res.redirect(getFullURL("/"));
        return;
      }
    }


    if (error) {
      if (!req.session.csrf) {
        req.session.csrf = crypto.randomUUID();
      }

      res.status(400).render("register", {
        title: "register",
        csrf: req.session.csrf,
        error: error,
      });
    }
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
    const { username, csrf } = req.body;

    const user = await getUser(username)
          .catch(() => false);

    if (csrf !== req.session.csrf) {
      if (!req.session.csrf) {
        req.session.csrf = crypto.randomUUID();
      }

      res.status(400).render("reset", {
        title: "password reset",
        csrf: req.session.csrf,
        error: "csrf invalid",
      });
      return;
    }

    if (user) {
      const code = crypto.randomBytes(4).toString("hex");
      await resetUserPass(user.username, code);
    }

    res.redirect(getFullURL("/register"));
  });


  app.get(path.join(basePath, "/logout"), async (req: Request, res: Response) => {
    await new Promise(res => req.session.destroy(res));

    res.sendStatus(200);
  });
}

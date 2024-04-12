import type { Express, Request, Response } from "express";
import path from "node:path";
import { basePath } from "./index";

export default function (app: Express) {
  app.get(path.join(basePath, "/"), (req: Request, res: Response) => {
    res.status(401).render("login", { title: "login" });
  });

  app.post(path.join(basePath, "/"), (req: Request, res: Response) => {
    res.sendStatus(401);
  });


  app.get(path.join(basePath, "/register"), (req: Request, res: Response) => {
    res.status(401).render("register", { title: "register" });
  });

  app.post(path.join(basePath, "/register"), (req: Request, res: Response) => {
    res.sendStatus(401);
  });


  app.get(path.join(basePath, "/reset"), (req: Request, res: Response) => {
    res.status(401).render("reset", { title: "password reset" });
  });

  app.post(path.join(basePath, "/reset"), (req: Request, res: Response) => {
    res.sendStatus(401);
  });
}

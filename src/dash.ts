import type { Express, NextFunction, Request, Response } from "express";
import crypto from "node:crypto";
import path from "node:path";
import { createCode, delCode, getCode, getCodes, getUser, getUsers, updateUser } from "./db";
import { basePath } from "./index";

export default function (app: Express) {
  const hasAccess = async (req: Request, res: Response, next: NextFunction) => {
    if (req.session.user) {
      const user = await getUser(req.session.user);
      if (user.perms.includes("root")) {
        next();
        return;
      }
    }
    res.sendStatus(403);
  };

  const renderDash = async (res: Response, opts: Record<string, any>) => {
    const users = (await getUsers())
          .sort((a, b) => a.username.localeCompare(b.username));
    res.render("dash", {
      title: "dash",
      codes: (await getCodes()).sort((a, b) => a.issued - b.issued),
      users: users,
      passResets: users.filter(v => v.passreset),
      ...opts,
    });
  };

  app.get(path.join(basePath, "/dash"), hasAccess, async (req: Request, res: Response) => {
    let success: string | undefined;
    if (req.query.delCode) {
      await delCode(req.query.delCode as string);
      success = "code deleted";
    }

    await renderDash(res, { success });
  });

  app.post(path.join(basePath, "/dash"), hasAccess, async (req: Request, res: Response) => {
    if (req.query.newCode !== undefined) {
      const { perms, expires } = req.body;
      const code = crypto.randomBytes(4).toString("hex");

      await createCode(code, perms.split(";"), expires ? new Date(expires) : undefined);

      await renderDash(res, {
        newCode: await getCode(code),
      });
      return;
    }

    if (req.query.editUser !== undefined) {
      const { perms, username, expires } = req.body;

      if (expires && !/^\d{4}-[01]\d-[0-3]\d$/.test(expires)) {
        await renderDash(res, {
          error: `invalid date (${expires}), must match yyyy-mm-dd format`,
        });
        return;
      }

      await updateUser(username, perms.split(";"), expires ? new Date(expires) : null);

      await renderDash(res, {
        success: `user ${username} updated`,
      });
      return;
    }

    res.sendStatus(404);
  });
}

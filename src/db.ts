import { postgres } from "./index";

//language=PostgreSQL
export async function getUser(name: string): Promise<any> {
  const users = await postgres.query("SELECT * FROM users WHERE username = $1", [ name ]);
  if (users.rowCount === 0) {
    throw new Error();
  }
  return users.rows[0];
}

//language=PostgreSQL
export async function createUser(name: string, password: string, perms: string[]): Promise<void> {
  await postgres.query(
        "INSERT INTO users (username, password, perms) values ($1, $2, $3)",
        [ name, password, perms ],
  );
}

//language=PostgreSQL
export async function changeUserPass(name: string, password: string): Promise<void> {
  await postgres.query(
        "UPDATE users SET password = $1, resetcode = '', passreset = false WHERE username = $2",
        [ password, name ],
  );
}

export async function changeUserPerms(name: string, perms: string) {
  await postgres.query(
        "UPDATE users SET perms = $1 WHERE username = $2",
        [ perms, name ],
  );
}

//language=PostgreSQL
export async function resetUserPass(name: string, code: string): Promise<void> {
  await postgres.query(
        "UPDATE users SET resetcode = $1, passreset = true WHERE username = $2",
        [ code, name ],
  );
}

//language=PostgreSQL
export async function getUsers(): Promise<any[]> {
  const users = await postgres.query("SELECT * FROM users");
  return users.rows;
}


//language=PostgreSQL
export async function getCode(code: string): Promise<any> {
  const codes = await postgres.query("SELECT * FROM codes WHERE code = $1", [ code ]);
  if (codes.rowCount === 0) {
    throw new Error();
  }
  return codes.rows[0];
}

//language=PostgreSQL
export async function delCode(code: string) {
  await postgres.query("DELETE FROM codes WHERE code = $1", [ code ]);
}

//language=PostgreSQL
export async function getCodes(): Promise<any[]> {
  const codes = await postgres.query("SELECT * FROM codes");
  return codes.rows;
}

//language=PostgreSQL
export async function createCode(code: string, perms?: string, expires?: Date) {
  if (!expires) {
    if (!perms) {
      await postgres.query("INSERT INTO codes (code) values ($1)", [ code ]);
    } else {
      await postgres.query("INSERT INTO codes (code, perms) values ($1, $2)", [ code, perms ]);
    }
  } else {
    if (!perms) {
      await postgres.query("INSERT INTO codes (code, expires) values ($1, $2)", [ code, expires ]);
    } else {
      await postgres.query(
            "INSERT INTO codes (code, expires, perms) values ($1, $2, $3)",
            [ code, expires, perms ],
      );
    }
  }
}

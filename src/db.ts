import { postgres } from "./index";

export async function getUser(name: string): Promise<any> {
  //language=PostgreSQL
  const users = await postgres.query("SELECT * FROM users WHERE username = $1", [ name ]);
  if (users.rowCount === 0) {
    throw new Error();
  }
  return users.rows[0];
}

export async function createUser(name: string, password: string, perms: string[]): Promise<void> {
  await postgres.query(
        //language=PostgreSQL
        "INSERT INTO users (username, password, perms) values ($1, $2, $3)",
        [ name, password, perms ],
  );
}

export async function userCount(): Promise<number> {
  //language=PostgreSQL
  return (await postgres.query("SELECT count(*) FROM users")).rows[0].count;
}


export async function getCode(code: string): Promise<any> {
  //language=PostgreSQL
  const codes = await postgres.query("SELECT * FROM codes WHERE code = $1", [ code ]);
  if (codes.rowCount === 0) {
    throw new Error();
  }
  return codes.rows[0];
}

export async function delCode(code: string) {
  await postgres.query("DELETE FROM codes WHERE code = $1", [ code ]);
}

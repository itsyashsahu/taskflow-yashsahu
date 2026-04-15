import type { Database } from "../lib/context.js"

export type PublicUserRow = {
  id: string
  name: string
  email: string
  created_at: string
}

export type UserWithPasswordRow = PublicUserRow & {
  password: string
}

export const authRepository = {
  findUserByEmail: async (db: Database, email: string) => {
    const [user] = await db<UserWithPasswordRow[]>`
      SELECT id, name, email, password, created_at
      FROM users
      WHERE email = ${email}
    `

    return user ?? null
  },

  createUser: async (
    db: Database,
    name: string,
    email: string,
    password: string
  ) => {
    const [user] = await db<PublicUserRow[]>`
      INSERT INTO users (name, email, password)
      VALUES (${name}, ${email}, ${password})
      RETURNING id, name, email, created_at
    `

    return user
  },
}
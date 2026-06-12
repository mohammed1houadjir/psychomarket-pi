import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const votes = pgTable('votes', {
  id: serial('id').primaryKey(),
  piUsername: text('piUsername').notNull(),
  action: text('action').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

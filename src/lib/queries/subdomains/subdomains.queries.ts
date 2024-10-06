import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { injectable } from "inversify";
import * as schema from "../../db/schema";
import { eq } from "drizzle-orm";

export interface ISubdomainQueries {
  GetSubdomain(name: string): Promise<any>;
  AddSubdomain(subdomain: string, tokenHash: string): Promise<any>;
  DeleteSubdomain(name: string): Promise<any>;
}

@injectable()
export class SubdomainQueries implements ISubdomainQueries {
  private db: BunSQLiteDatabase<typeof schema>;

  constructor(db: BunSQLiteDatabase<typeof schema>) {
    this.db = db;
  }

  public async GetSubdomain(name: string) {
    return await this.db.query.subdomains.findFirst({
      where: eq(schema.subdomains.subdomain, name),
    });
  }

  public async AddSubdomain(subdomain: string, tokenHash: string) {
    return await this.db
      .insert(schema.subdomains)
      .values({ subdomain, tokenHash })
      .execute();
  }

  public async DeleteSubdomain(name: string) {
    return await this.db
      .delete(schema.subdomains)
      .where(eq(schema.subdomains.subdomain, name))
      .execute();
  }
}

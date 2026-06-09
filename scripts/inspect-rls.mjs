import { Client } from "pg";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
const client = new Client({ connectionString: url });
await client.connect();

const q = async (label, sql) => {
  const { rows } = await client.query(sql);
  console.log(`\n=== ${label} ===`);
  console.table(rows);
};

// 1. Which role am I connected as, and does it bypass RLS / is it superuser?
await q(
  "current connection role",
  `select current_user,
          (select rolbypassrls from pg_roles where rolname = current_user) as bypassrls,
          (select rolsuper     from pg_roles where rolname = current_user) as superuser`,
);

// 2. RLS enabled on our tables?
await q(
  "RLS status",
  `select relname, relrowsecurity as rls_enabled, relforcerowsecurity as rls_forced
     from pg_class
    where relname in ('profiles','agent_invitations')`,
);

// 3. Existing policies
await q(
  "existing policies",
  `select tablename, policyname, cmd, roles
     from pg_policies
    where tablename in ('profiles','agent_invitations')`,
);

// 4. Table-level grants held by anon / authenticated (what the public API can do)
await q(
  "anon/authenticated table grants",
  `select grantee, table_name, privilege_type
     from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name in ('profiles','agent_invitations')
      and grantee in ('anon','authenticated')
    order by grantee, table_name, privilege_type`,
);

await client.end();

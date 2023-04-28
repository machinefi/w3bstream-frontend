import { authProcedure, t } from '../trpc';
import { z } from 'zod';
import { inferProcedureOutput, TRPCError } from '@trpc/server';
import { PostgresMeta } from '@/postgres-meta/index';
import { DEFAULT_POOL_CONFIG, getConnectionString, PG_CONNECTION } from '@/constants/postgres-meta';
import format from 'pg-format';

export const pgRouter = t.router({
  dbState: t.procedure.query(async ({ ctx }) => {
    const pgMeta = new PostgresMeta({ ...DEFAULT_POOL_CONFIG, connectionString: PG_CONNECTION });
    const sizeResult = await pgMeta.query(`SELECT pg_database_size(DATname) AS size FROM pg_database`);
    await pgMeta.end();
    if (sizeResult.error) {
      return { errorMsg: sizeResult.error.message };
    }
    const sizes = sizeResult.data.map((r) => Number(r.size));
    const usedSize = (sizes.reduce((acc, size) => acc + size, 0) / 1024 / 1024).toFixed(4); // mb
    const statsResult = await pgMeta.query(
      `SELECT datname,numbackends,xact_commit,xact_rollback,blks_read,blks_hit,tup_returned,tup_fetched,tup_inserted,tup_updated,tup_deleted FROM pg_stat_database;`
    );
    await pgMeta.end();
    if (statsResult.error) {
      return { errorMsg: statsResult.error.message };
    }
    return { usedSize: Number(usedSize), stats: statsResult.data, errorMsg: '' };
  }),
  schemas: authProcedure
    .input(
      z.object({
        projectID: z.string()
      })
    )
    .query(async ({ ctx, input }) => {
      const pgMeta = new PostgresMeta({ ...DEFAULT_POOL_CONFIG, connectionString: getConnectionString(input.projectID) });
      const { data, error } = await pgMeta.schemas.list();
      await pgMeta.end();
      return { schemas: data, errorMsg: error?.message };
    }),
  tables: authProcedure
    .input(
      z.object({
        projectID: z.string(),
        includedSchemas: z.array(z.string())
      })
    )
    .query(async ({ ctx, input }) => {
      const pgMeta = new PostgresMeta({ ...DEFAULT_POOL_CONFIG, connectionString: getConnectionString(input.projectID) });
      const { data, error } = await pgMeta.tables.list({
        includedSchemas: input.includedSchemas,
        includeColumns: false
      });
      await pgMeta.end();
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }
      return data
        .filter((item) => item.name !== 't_sql_meta_enum')
        .map((item) => {
          return {
            tableId: item.id,
            tableSchema: item.schema,
            tableName: item.name
          };
        });
    }),
  createTable: authProcedure
    .input(
      z.object({
        projectID: z.string(),
        schema: z.string(),
        name: z.string(),
        comment: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const pgMeta = new PostgresMeta({ ...DEFAULT_POOL_CONFIG, connectionString: getConnectionString(input.projectID) });
      const { data, error } = await pgMeta.tables.create({
        schema: input.schema,
        name: input.name,
        comment: input.comment
      });
      await pgMeta.end();
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }
      return data;
    }),
  updateTable: authProcedure
    .input(
      z.object({
        projectID: z.string(),
        id: z.number(),
        name: z.string().optional(),
        rls_enabled: z.boolean().optional(),
        rls_forced: z.boolean().optional(),
        replica_identity: z
          .string(
            z.custom((val) => {
              if (val === 'DEFAULT' || val === 'FULL' || val === 'INDEX' || val === 'NOTHING') {
                return true;
              }
              return false;
            })
          )
          .optional(),
        replica_identity_index: z.string().optional(),
        primary_keys: z.optional(
          z.array(
            z.object({
              name: z.string()
            })
          )
        ),
        comment: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const pgMeta = new PostgresMeta({ ...DEFAULT_POOL_CONFIG, connectionString: getConnectionString(input.projectID) });
      const { data, error } = await pgMeta.tables.update(input.id, {
        name: input.name,
        rls_enabled: input.rls_enabled,
        rls_forced: input.rls_forced,
        // @ts-ignore
        replica_identity: input.replica_identity,
        replica_identity_index: input.replica_identity_index,
        // @ts-ignore
        primary_keys: input.primary_keys,
        comment: input.comment
      });
      await pgMeta.end();
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }
      return data;
    }),
  deleteTable: authProcedure
    .input(
      z.object({
        projectID: z.string(),
        tableId: z.number(),
        cascade: z.boolean().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cascade = input.cascade || false;
      const pgMeta = new PostgresMeta({ ...DEFAULT_POOL_CONFIG, connectionString: getConnectionString(input.projectID) });
      const { data, error } = await pgMeta.tables.remove(input.tableId, { cascade });
      await pgMeta.end();
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }
      return data;
    }),
  columns: authProcedure
    .input(
      z.object({
        projectID: z.string(),
        tableId: z.number()
      })
    )
    .query(async ({ ctx, input }) => {
      const pgMeta = new PostgresMeta({ ...DEFAULT_POOL_CONFIG, connectionString: getConnectionString(input.projectID) });
      const { data, error } = await pgMeta.columns.list({
        includeSystemSchemas: false,
        tableId: Number(input.tableId)
      });
      await pgMeta.end();
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      }
      return data;
    }),
  createColumn: authProcedure
    .input(
      z.object({
        projectID: z.string(),
        tableId: z.number(),
        name: z.string(),
        type: z.string(),
        defaultValue: z.any().optional(),
        defaultValueFormat: z.string().optional(),
        isIdentity: z.boolean().optional(),
        isNullable: z.boolean().optional(),
        isUnique: z.boolean().optional(),
        isPrimaryKey: z.boolean().optional(),
        comment: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const pgMeta = new PostgresMeta({ ...DEFAULT_POOL_CONFIG, connectionString: getConnectionString(input.projectID) });
      const { data, error } = await pgMeta.columns.create({
        table_id: input.tableId,
        name: input.name,
        type: input.type,
        default_value: input.defaultValue,
        // @ts-ignore
        default_value_format: input.defaultValueFormat,
        is_identity: input.isIdentity,
        is_nullable: input.isNullable,
        is_unique: input.isUnique,
        is_primary_key: input.isPrimaryKey,
        comment: input.comment
      });
      await pgMeta.end();
      return { data, errorMsg: error?.message };
    }),
  updateColumn: authProcedure
    .input(
      z.object({
        projectID: z.string(),
        columnId: z.string(),
        name: z.string().optional(),
        type: z.string().optional(),
        defaultValue: z.any().optional(),
        defaultValueFormat: z.string().optional(),
        isIdentity: z.boolean().optional(),
        isNullable: z.boolean().optional(),
        isUnique: z.boolean().optional(),
        comment: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const pgMeta = new PostgresMeta({ ...DEFAULT_POOL_CONFIG, connectionString: getConnectionString(input.projectID) });
      const { data, error } = await pgMeta.columns.update(input.columnId, {
        name: input.name,
        type: input.type,
        default_value: input.defaultValue,
        // @ts-ignore
        default_value_format: input.defaultValueFormat,
        is_identity: input.isIdentity,
        is_nullable: input.isNullable,
        is_unique: input.isUnique,
        comment: input.comment
      });
      await pgMeta.end();
      return { data, errorMsg: error?.message };
    }),
  deleteColumn: authProcedure
    .input(
      z.object({
        projectID: z.string(),
        columnId: z.string(),
        cascade: z.boolean().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cascade = input.cascade || false;
      const pgMeta = new PostgresMeta({ ...DEFAULT_POOL_CONFIG, connectionString: getConnectionString(input.projectID) });
      const { data, error } = await pgMeta.columns.remove(input.columnId, { cascade });
      await pgMeta.end();
      return { data, errorMsg: error?.message };
    }),
  query: authProcedure
    .input(
      z.object({
        projectID: z.string(),
        sql: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const pgMeta = new PostgresMeta({ ...DEFAULT_POOL_CONFIG, connectionString: getConnectionString(input.projectID) });
      const { data, error } = await pgMeta.query(input.sql);
      await pgMeta.end();
      return { data, errorMsg: error?.message };
    }),
  dataCount: authProcedure
    .input(
      z.object({
        projectID: z.string(),
        tableSchema: z.string(),
        tableName: z.string()
      })
    )
    .query(async ({ ctx, input }) => {
      const pgMeta = new PostgresMeta({ ...DEFAULT_POOL_CONFIG, connectionString: getConnectionString(input.projectID) });
      const sql = `SELECT COUNT(*) FROM ${format.string(`${input.tableSchema}.${input.tableName}`)}`;
      const { data, error } = await pgMeta.query(sql);
      await pgMeta.end();
      return { data, errorMsg: error?.message };
    }),
  tableData: authProcedure
    .input(
      z.object({
        projectID: z.string(),
        tableSchema: z.string(),
        tableName: z.string(),
        page: z.number().optional().default(1),
        pageSize: z.number().optional().default(10)
      })
    )
    .query(async ({ ctx, input }) => {
      const pgMeta = new PostgresMeta({ ...DEFAULT_POOL_CONFIG, connectionString: getConnectionString(input.projectID) });
      const offset = (input.page - 1) * input.pageSize;
      const sql = `SELECT * FROM ${format.string(`${input.tableSchema}.${input.tableName}`)} LIMIT ${input.pageSize} OFFSET ${offset}`;
      const { data, error } = await pgMeta.query(sql);
      await pgMeta.end();
      return { data, errorMsg: error?.message };
    }),
  createTableData: authProcedure
    .input(
      z.object({
        projectID: z.string(),
        tableSchema: z.string(),
        tableName: z.string(),
        keys: z.array(z.string()),
        values: z.array(z.any())
      })
    )
    .mutation(async ({ ctx, input }) => {
      const pgMeta = new PostgresMeta({ ...DEFAULT_POOL_CONFIG, connectionString: getConnectionString(input.projectID) });
      const sql = format(`INSERT INTO %I.%I (%I) VALUES (%L)`, input.tableSchema, input.tableName, input.keys, input.values);
      const { error } = await pgMeta.query(sql);
      await pgMeta.end();
      return { errorMsg: error?.message };
    }),
  deleteTableData: authProcedure
    .input(
      z.object({
        projectID: z.string(),
        tableSchema: z.string(),
        tableName: z.string(),
        name: z.string(),
        value: z.any()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const pgMeta = new PostgresMeta({ ...DEFAULT_POOL_CONFIG, connectionString: getConnectionString(input.projectID) });
      const sql = format(`DELETE FROM %I.%I WHERE %I = %L`, input.tableSchema, input.tableName, input.name, input.value);
      const { error } = await pgMeta.query(sql);
      await pgMeta.end();
      return { errorMsg: error?.message };
    })
});

export type PgRouter = typeof pgRouter;
export type TableType = inferProcedureOutput<PgRouter['tables']>[0];
export type ColumnType = inferProcedureOutput<PgRouter['columns']>[0];

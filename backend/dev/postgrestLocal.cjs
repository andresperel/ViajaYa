// Development/test adapter only. SQL is executed by local PostgreSQL (PGlite).
// The production entry point never imports this file or changes its DB client.
const quoted = (name) => `"${name.replaceAll('"', '""')}"`;
function createLocalClient(db) {
  function from(table) {
    let fields = "*",
      operation = "select",
      data,
      exact = false,
      single = false;
    const filters = [],
      orders = [];
    let range;
    const chain = {
      select(value = "*", options = {}) {
        fields = value;
        exact = options.count === "exact";
        return chain;
      },
      eq(key, value) {
        filters.push([key, "=", value]);
        return chain;
      },
      gt(key, value) {
        filters.push([key, ">", value]);
        return chain;
      },
      gte(key, value) {
        filters.push([key, ">=", value]);
        return chain;
      },
      lte(key, value) {
        filters.push([key, "<=", value]);
        return chain;
      },
      order(key, options = {}) {
        orders.push(
          `t.${quoted(key)} ${options.ascending === false ? "DESC" : "ASC"}`,
        );
        return chain;
      },
      range(start, end) {
        range = [start, end];
        return chain;
      },
      insert(value) {
        operation = "insert";
        data = Array.isArray(value) ? value[0] : value;
        return chain;
      },
      update(value) {
        operation = "update";
        data = value;
        return chain;
      },
      delete() {
        operation = "delete";
        return chain;
      },
      single() {
        single = true;
        return chain;
      },
      maybeSingle() {
        single = true;
        return chain;
      },
      then(resolve, reject) {
        return execute().then(resolve, reject);
      },
    };
    async function execute() {
      try {
        const values = [];
        const param = (value) => {
          values.push(value);
          return `$${values.length}`;
        };
        let statement, predicate;
        if (operation === "insert")
          statement = `INSERT INTO public.${quoted(table)} (${Object.keys(data).map(quoted).join(",")}) VALUES (${Object.values(data).map(param).join(",")})`;
        else if (operation === "update")
          statement = `UPDATE public.${quoted(table)} t SET ${Object.entries(
            data,
          )
            .map(([k, v]) => `${quoted(k)}=${param(v)}`)
            .join(",")}`;
        else if (operation === "delete")
          statement = `DELETE FROM public.${quoted(table)} t`;
        else {
          let selected;
          if (fields.includes("EmpresaCorporativa("))
            selected = `t.id,t."empresaId",t.rol,t.activo,(SELECT jsonb_build_object('id',c.id,'nombre',c.nombre,'activa',c.activa,'razonSocial',c."razonSocial",'identificacionFiscal',c."identificacionFiscal",'direccion',c.direccion) FROM public."EmpresaCorporativa" c WHERE c.id=t."empresaId") AS "EmpresaCorporativa"`;
          else if (fields.includes("BusinessRegistro("))
            selected = `t.*,(SELECT jsonb_build_object('nombre',u.nombre,'email',u.email) FROM public."Usuario" u WHERE u."idUsuario"=t."idUsuario") AS "Usuario",(SELECT jsonb_build_object('estado',r.estado,'creada',r.creada,'moneda',r.moneda,'fuente',r.fuente) FROM public."BusinessRegistro" r WHERE r."viajeId"=t."idViaje") AS "BusinessRegistro"`;
          else
            selected =
              fields === "*"
                ? "t.*"
                : fields
                    .split(",")
                    .map((f) => `t.${quoted(f)}`)
                    .join(",");
          statement = `SELECT ${selected} FROM public.${quoted(table)} t`;
        }
        if (filters.length)
          predicate = ` WHERE ${filters.map(([key, op, value]) => `t.${quoted(key)} ${op} ${param(value)}`).join(" AND ")}`;
        statement += predicate || "";
        let total;
        if (exact && operation === "select")
          total = Number(
            (
              await db.query(
                `SELECT count(*) AS n FROM public.${quoted(table)} t${predicate || ""}`,
                values,
              )
            ).rows[0].n,
          );
        if (operation === "select") {
          if (orders.length) statement += ` ORDER BY ${orders.join(",")}`;
          if (range)
            statement += ` LIMIT ${range[1] - range[0] + 1} OFFSET ${range[0]}`;
        } else statement += " RETURNING *";
        const rows = (await db.query(statement, values)).rows;
        if (single && rows.length > 1)
          throw new Error("Expected at most one row");
        return {
          data: single ? rows[0] || null : rows,
          error: null,
          count: total,
        };
      } catch (error) {
        return { data: null, error };
      }
    }
    return chain;
  }
  return {
    from,
    async rpc(name, args) {
      if (name !== "business_web_command")
        return { data: null, error: new Error("Unsupported local function") };
      try {
        const response = await db.query(
          "SELECT public.business_web_command($1,$2,$3::jsonb) AS result",
          [args.p_actor, args.p_action, JSON.stringify(args.p_data)],
        );
        return { data: response.rows[0].result, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    auth: {
      async getUser() {
        return {
          data: { user: null },
          error: new Error("OAuth is not enabled in disposable local mode"),
        };
      },
    },
  };
}
module.exports = { createLocalClient };

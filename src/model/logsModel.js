const db = require('../config/db');

class LogsModel {

  /**
   * Crear un nuevo log de actividad
   */
  static async crear(data) {
    const {
      usuario_id,
      usuario_nombre,
      usuario_rol,
      tipo,
      accion,
      entidad_id = null,
      entidad_nombre = null,
      descripcion,
      detalles = null,
      ip_address = null,
      user_agent = null
    } = data;

    const query = `
      INSERT INTO logs_actividad (
        usuario_id, usuario_nombre, usuario_rol, tipo, accion,
        entidad_id, entidad_nombre, descripcion, detalles,
        ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      usuario_id,
      usuario_nombre,
      usuario_rol,
      tipo,
      accion,
      entidad_id,
      entidad_nombre,
      descripcion,
      detalles ? JSON.stringify(detalles) : null,
      ip_address,
      user_agent
    ];

    const [result] = await db.execute(query, values);
    return result.insertId;
  }

  /**
   * Obtener logs recientes
   */
  static async obtenerRecientes(limite = 10) {
    const query = `
      SELECT 
        id,
        usuario_nombre,
        usuario_rol,
        tipo,
        accion,
        entidad_nombre,
        descripcion,
        detalles,
        created_at as fecha
      FROM logs_actividad
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const [rows] = await db.execute(query, [limite]);
    return rows;
  }

  /**
   * Obtener logs con filtros
   */
  static async obtenerConFiltros(filtros = {}, pagina = 1, limite = 20) {
    const offset = (pagina - 1) * limite;
    let condiciones = [];
    let valores = [];

    if (filtros.usuario_id) {
      condiciones.push('usuario_id = ?');
      valores.push(filtros.usuario_id);
    }

    if (filtros.tipo) {
      condiciones.push('tipo = ?');
      valores.push(filtros.tipo);
    }

    if (filtros.accion) {
      condiciones.push('accion = ?');
      valores.push(filtros.accion);
    }

    if (filtros.fecha_desde) {
      condiciones.push('DATE(created_at) >= ?');
      valores.push(filtros.fecha_desde);
    }

    if (filtros.fecha_hasta) {
      condiciones.push('DATE(created_at) <= ?');
      valores.push(filtros.fecha_hasta);
    }

    if (filtros.busqueda) {
      condiciones.push('(descripcion LIKE ? OR entidad_nombre LIKE ? OR usuario_nombre LIKE ?)');
      const term = `%${filtros.busqueda}%`;
      valores.push(term, term, term);
    }

    const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
    const query = `
      SELECT 
        id,
        usuario_id,
        usuario_nombre,
        usuario_rol,
        tipo,
        accion,
        entidad_id,
        entidad_nombre,
        descripcion,
        detalles,
        created_at as fecha
      FROM logs_actividad
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    valores.push(limite, offset);
    const [rows] = await db.execute(query, valores);

    // Contar total
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM logs_actividad 
      ${whereClause}
    `;
    const [countResult] = await db.execute(countQuery, valores.slice(0, -2));

    return {
      datos: rows,
      total: countResult[0]?.total || 0,
      pagina,
      limite
    };
  }

  /**
   * Obtener logs del dashboard (últimos 5)
   */
  static async obtenerDashboard() {
    const query = `
      SELECT 
        id,
        usuario_nombre,
        usuario_rol,
        tipo,
        accion,
        entidad_nombre,
        descripcion,
        created_at as fecha
      FROM logs_actividad
      ORDER BY created_at DESC
      LIMIT 5
    `;
    const [rows] = await db.execute(query);
    return rows;
  }

  /**
   * Contar logs no leídos (para notificaciones)
   */
  static async contarNoLeidos() {
    const query = `
      SELECT COUNT(*) as total 
      FROM logs_actividad 
      WHERE DATE(created_at) = CURDATE()
    `;
    const [rows] = await db.execute(query);
    return rows[0]?.total || 0;
  }

  /**
   * Eliminar logs antiguos (más de 30 días)
   */
  static async limpiarAntiguos(dias = 30) {
    const query = `
      DELETE FROM logs_actividad 
      WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    const [result] = await db.execute(query, [dias]);
    return result.affectedRows;
  }

  /**
   * Registrar actividad de usuario (método helper)
   */
  static async registrarActividad({
    usuario,
    tipo,
    accion,
    entidad_id = null,
    entidad_nombre = null,
    descripcion,
    detalles = null,
    req = null
  }) {
    const logData = {
      usuario_id: usuario?.id || null,
      usuario_nombre: usuario?.nombre || 'Sistema',
      usuario_rol: usuario?.rol || 'sistema',
      tipo,
      accion,
      entidad_id,
      entidad_nombre,
      descripcion,
      detalles,
      ip_address: req?.ip || req?.connection?.remoteAddress || null,
      user_agent: req?.headers?.['user-agent'] || null
    };

    return await LogsModel.crear(logData);
  }
}

module.exports = LogsModel;
const db = require('../config/db');

class LogsService {

  /**
   * Registrar una actividad en los logs
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
    try {
      const query = `
        INSERT INTO logs_actividad (
          usuario_id, usuario_nombre, usuario_rol, tipo, accion,
          entidad_id, entidad_nombre, descripcion, detalles,
          ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        usuario?.id || null,
        usuario?.nombre || 'Sistema',
        usuario?.rol || 'sistema',
        tipo,
        accion,
        entidad_id,
        entidad_nombre,
        descripcion,
        detalles ? JSON.stringify(detalles) : null,
        req?.ip || req?.connection?.remoteAddress || null,
        req?.headers?.['user-agent'] || null
      ];

      const [result] = await db.execute(query, values);
      return result.insertId;
    } catch (error) {
      console.error('Error registrando log:', error);
      // No lanzamos error para no interrumpir la operación principal
      return null;
    }
  }

  /**
   * Obtener logs del dashboard (últimos 5)
   */
  static async obtenerDashboard() {
    try {
      const [rows] = await db.query(`
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
      `);
      return rows;
    } catch (error) {
      console.error('Error obteniendo logs dashboard:', error);
      return [];
    }
  }

  /**
   * Obtener logs recientes
   */
  static async obtenerRecientes(limite = 10) {
    try {
      const [rows] = await db.query(`
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
        LIMIT ?
      `, [limite]);
      return rows;
    } catch (error) {
      console.error('Error obteniendo logs recientes:', error);
      return [];
    }
  }

  /**
   * Contar logs del día (para notificaciones)
   */
  static async contarNoLeidos() {
    try {
      const [rows] = await db.query(`
        SELECT COUNT(*) as total 
        FROM logs_actividad 
        WHERE DATE(created_at) = CURDATE()
      `);
      return rows[0]?.total || 0;
    } catch (error) {
      console.error('Error contando logs:', error);
      return 0;
    }
  }
}

module.exports = LogsService;
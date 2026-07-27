const LogsService = require('../services/logsService');
const { ok, error } = require('../utils/response');

class LogsController {

  /**
   * Obtener logs recientes
   */
  static async obtenerRecientes(req, res) {
    try {
      const limite = parseInt(req.query.limite) || 10;
      const logs = await LogsService.obtenerRecientes(limite);
      return ok(res, logs, 'Logs recientes obtenidos');
    } catch (err) {
      console.error('Error obteniendo logs recientes:', err);
      return error(res, 'Error al obtener logs recientes', 500);
    }
  }

  /**
   * Obtener logs del dashboard
   */
  static async obtenerDashboard(req, res) {
    try {
      const logs = await LogsService.obtenerDashboard();
      return ok(res, logs, 'Logs del dashboard obtenidos');
    } catch (err) {
      console.error('Error obteniendo logs del dashboard:', err);
      return error(res, 'Error al obtener logs del dashboard', 500);
    }
  }

  /**
   * Obtener logs con filtros
   */
  static async obtenerConFiltros(req, res) {
    try {
      const { 
        usuario_id, 
        tipo, 
        accion, 
        fecha_desde, 
        fecha_hasta, 
        busqueda,
        pagina = 1,
        limite = 20
      } = req.query;

      const filtros = {
        usuario_id,
        tipo,
        accion,
        fecha_desde,
        fecha_hasta,
        busqueda
      };

      // Limpiar filtros vacíos
      Object.keys(filtros).forEach(key => {
        if (filtros[key] === undefined || filtros[key] === null || filtros[key] === '') {
          delete filtros[key];
        }
      });

      const resultado = await LogsService.obtenerConFiltros(
        filtros,
        parseInt(pagina),
        parseInt(limite)
      );

      return ok(res, resultado, 'Logs obtenidos');
    } catch (err) {
      console.error('Error obteniendo logs con filtros:', err);
      return error(res, 'Error al obtener logs', 500);
    }
  }

  /**
   * Contar logs no leídos
   */
  static async contarNoLeidos(req, res) {
    try {
      const total = await LogsService.contarNoLeidos();
      return ok(res, { total }, 'Conteo de logs no leídos');
    } catch (err) {
      console.error('Error contando logs no leídos:', err);
      return error(res, 'Error al contar logs', 500);
    }
  }
}

module.exports = LogsController;
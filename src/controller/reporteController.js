const db = require('../config/db');


// =========================
// STATS GENERALES
// =========================
exports.stats = async (req, res) => {

  try {

    const [[proyectos]] = await db.query(
      'SELECT COUNT(*) AS total FROM proyectos'
    );


    const [[evaluaciones]] = await db.query(
      'SELECT COUNT(*) AS total FROM evaluaciones'
    );


    return res.json({
      ok: true,
      data: {
        proyectos: proyectos.total,
        evaluaciones: evaluaciones.total
      }
    });


  } catch (error) {

    console.error(
      'ERROR STATS:',
      error
    );


    return res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener estadísticas'
    });

  }

};




// =========================
// RANKING GENERAL
// =========================
exports.ranking = async (req, res) => {

  try {


    const [rows] = await db.query(`

      SELECT

        p.nombre,

        ROUND(
          SUM(n.puntaje),
          2
        ) AS puntaje_total,


        COUNT(d.id) AS total_items,


        ROUND(
          (SUM(n.puntaje) * 100.0) / 60,
          2
        ) AS promedio,


        CASE

          WHEN SUM(n.puntaje) >= 53
            THEN 'Sobresaliente'

          WHEN SUM(n.puntaje) >= 46
            THEN 'Bueno'

          WHEN SUM(n.puntaje) >= 36
            THEN 'Regular'

          ELSE 'Insuficiente'

        END AS calificacion


      FROM evaluaciones e


      INNER JOIN proyectos p
        ON p.id = e.proyecto_id


      INNER JOIN detalles_evaluacion d
        ON d.evaluacion_id = e.id


      INNER JOIN niveles n
        ON n.id = d.nivel_id


      GROUP BY
        p.id,
        p.nombre


      ORDER BY
        promedio DESC

    `);


    return res.json({
      ok: true,
      data: rows
    });


  } catch(error){

    console.error(
      'ERROR RANKING:',
      error
    );


    return res.status(500).json({
      ok:false,
      mensaje:'Error al generar ranking'
    });

  }

};




// =========================
// REPORTES POR PROYECTO
// =========================
exports.proyectos = async (req,res)=>{


  try{


    const [rows] = await db.query(`

      SELECT

        p.id,

        p.nombre AS proyecto,


        COUNT(DISTINCT e.id)
          AS evaluaciones,


        ROUND(
          AVG(n.puntaje),
          2
        )
        AS promedio,


        u.nombre AS evaluador,


        u.rol,


        ROUND(
          SUM(n.puntaje),
          2
        )
        AS puntaje



      FROM proyectos p


      LEFT JOIN evaluaciones e
        ON e.proyecto_id = p.id


      LEFT JOIN detalles_evaluacion d
        ON d.evaluacion_id = e.id


      LEFT JOIN niveles n
        ON n.id = d.nivel_id


      LEFT JOIN usuarios u
        ON u.id = e.evaluador_id



      GROUP BY

        p.id,
        p.nombre,
        u.id,
        u.nombre,
        u.rol



      ORDER BY

        p.nombre ASC

    `);



    const proyectos = [];


    rows.forEach(row=>{


      let proyecto = proyectos.find(
        p => p.proyecto === row.proyecto
      );


      if(!proyecto){

        proyecto = {

          proyecto: row.proyecto,

          evaluaciones: row.evaluaciones,

          promedio: row.promedio,

          evaluadores: []

        };


        proyectos.push(proyecto);

      }



      if(row.evaluador){


        proyecto.evaluadores.push({

          nombre: row.evaluador,

          rol: row.rol,

          puntaje: row.puntaje

        });


      }


    });



    return res.json({

      ok:true,

      data: proyectos

    });



  }catch(error){


    console.error(
      'ERROR REPORTES PROYECTOS:',
      error
    );


    return res.status(500).json({

      ok:false,

      mensaje:'Error al obtener reportes por proyecto'

    });


  }

  exports.exportar = async(req,res)=>{

  return res.json({

    ok:true,

    mensaje:'Exportación pendiente'

  });

};
};
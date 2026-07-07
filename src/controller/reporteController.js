const db = require('../config/db');


// ======================================================
// STATS GENERALES
// ======================================================
exports.stats = async (req, res) => {

  try {

    const [[proyectos]] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM proyectos
      `
    );


    const [[evaluaciones]] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM evaluaciones
      `
    );


    return res.json({

      ok: true,

      data: {

        proyectos: proyectos.total || 0,

        evaluaciones: evaluaciones.total || 0,

        completadas: evaluaciones.total || 0,

        promedio: 0

      }

    });


  } catch (error) {

    console.error(
      'ERROR STATS:',
      error
    );


    return res.status(500).json({

      ok:false,

      mensaje:'Error al obtener estadísticas'

    });

  }

};





// ======================================================
// RANKING GENERAL
// ======================================================
exports.ranking = async (req,res)=>{

  try {


    const [rows] = await db.query(`

      SELECT

        p.id,

        p.nombre,


        ROUND(
          SUM(n.puntaje),
          2
        ) AS puntaje_total,


        ROUND(
          AVG(n.puntaje),
          2
        ) AS promedio,


        COUNT(DISTINCT e.id)
          AS evaluaciones



      FROM proyectos p


      INNER JOIN evaluaciones e

        ON e.proyecto_id = p.id


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

      ok:true,

      data:rows

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






// ======================================================
// REPORTES POR PROYECTO
// ======================================================
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



    const resultado = [];



    rows.forEach(row=>{


      let proyecto = resultado.find(
        item => item.proyecto === row.proyecto
      );



      if(!proyecto){


        proyecto = {


          proyecto: row.proyecto,


          evaluaciones:
            row.evaluaciones || 0,


          promedio:
            row.promedio || 0,


          evaluadores:[]

        };



        resultado.push(proyecto);


      }




      if(row.evaluador){


        proyecto.evaluadores.push({


          nombre:
            row.evaluador,


          rol:
            row.rol,


          puntaje:
            row.puntaje || 0


        });


      }



    });



    return res.json({

      ok:true,

      data:resultado

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


};







// ======================================================
// EXPORTAR REPORTE
// ======================================================
exports.exportar = async(req,res)=>{


  try{


    /*
      Aquí después podemos colocar ExcelJS
      para generar el archivo .xlsx

      Por ahora devuelve respuesta válida
    */


    return res.json({

      ok:true,

      mensaje:
        'Exportación disponible próximamente'


    });



  }catch(error){


    console.error(

      'ERROR EXPORTAR:',

      error

    );


    return res.status(500).json({

      ok:false,

      mensaje:'Error al exportar reporte'

    });



  }


};
const db = require('../config/db');


// =====================================
// STATS GENERALES
// =====================================
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

        proyectos: proyectos.total,

        evaluaciones: evaluaciones.total,

        completadas: evaluaciones.total,

        promedio: 0

      }

    });


  } catch(error){

    console.error(
      'ERROR STATS:',
      error
    );


    return res.status(500).json({

      ok:false,

      mensaje:'Error obteniendo estadísticas'

    });

  }

};




// =====================================
// RANKING GENERAL
// =====================================
exports.ranking = async (req,res)=>{

  try{


    const [rows] = await db.query(`

      SELECT

        p.nombre AS proyecto,


        ROUND(
          SUM(n.puntaje),
          2
        ) AS puntaje_total,


        ROUND(
          AVG(n.puntaje),
          2
        ) AS promedio


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


      ORDER BY promedio DESC


    `);



    return res.json({

      ok:true,

      data:rows

    });



  }catch(error){


    console.error(
      'ERROR RANKING:',
      error
    );


    return res.status(500).json({

      ok:false,

      mensaje:'Error generando ranking'

    });

  }

};





// =====================================
// REPORTES POR PROYECTO
// =====================================
exports.proyectos = async(req,res)=>{


  try{


    const [rows] = await db.query(`

      SELECT


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



    const proyectos=[];



    rows.forEach(row=>{


      let proyecto =
        proyectos.find(
          p=>p.proyecto===row.proyecto
        );


      if(!proyecto){


        proyecto={

          proyecto:row.proyecto,

          evaluaciones:row.evaluaciones,

          promedio:row.promedio,

          evaluadores:[]

        };


        proyectos.push(proyecto);


      }



      if(row.evaluador){


        proyecto.evaluadores.push({

          nombre:row.evaluador,

          rol:row.rol,

          puntaje:row.puntaje

        });


      }


    });



    return res.json({

      ok:true,

      data:proyectos

    });



  }catch(error){


    console.error(
      'ERROR REPORTES PROYECTOS:',
      error
    );


    return res.status(500).json({

      ok:false,

      mensaje:'Error obteniendo reportes'

    });


  }


};




// =====================================
// EXPORTAR REPORTE
// =====================================
// =====================================
// EXPORTAR REPORTE EXCEL
// =====================================
exports.exportar = async(req,res)=>{

  try {


    const [rows] = await db.query(`

      SELECT

        p.nombre AS proyecto,

        u.nombre AS evaluador,

        u.rol,

        ROUND(
          SUM(n.puntaje),
          2
        ) AS puntaje,


        ROUND(
          AVG(n.puntaje),
          2
        ) AS promedio



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

        p.nombre,
        u.nombre,
        u.rol


      ORDER BY

        p.nombre ASC


    `);



    const ExcelJS = require('exceljs');


    const workbook =
      new ExcelJS.Workbook();



    const sheet =
      workbook.addWorksheet(
        'Reporte Evaluaciones'
      );



    sheet.columns = [

      {
        header:'Proyecto',
        key:'proyecto',
        width:30
      },


      {
        header:'Evaluador',
        key:'evaluador',
        width:30
      },


      {
        header:'Rol',
        key:'rol',
        width:20
      },


      {
        header:'Puntaje',
        key:'puntaje',
        width:15
      },


      {
        header:'Promedio',
        key:'promedio',
        width:15
      }

    ];



    rows.forEach(row=>{

      sheet.addRow(row);

    });



    sheet.getRow(1).font = {
      bold:true
    };



    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );


    res.setHeader(
      'Content-Disposition',
      'attachment; filename=reporte-evaluaciones.xlsx'
    );



    await workbook.xlsx.write(res);



    res.end();



  } catch(error){


    console.error(
      'ERROR EXPORTAR EXCEL:',
      error
    );


    return res.status(500).json({

      ok:false,

      mensaje:
      'Error generando Excel'

    });


  }

};


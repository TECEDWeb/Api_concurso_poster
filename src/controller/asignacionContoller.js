const AsignacionService = require('../services/asignacionService');

const controller = {

    async listar(req,res){

        try{

            const data=await AsignacionService.getAsignaciones();

            res.json({

                ok:true,
                data

            });

        }catch(err){

            console.error(err);

            res.status(500).json({

                ok:false,
                mensaje:'Error al listar asignaciones'

            });

        }

    },

    async proyectos(req,res){

        try{

            const data=await AsignacionService.getProyectos();

            res.json({

                ok:true,
                data

            });

        }catch(err){

            console.error(err);

            res.status(500).json({

                ok:false

            });

        }

    },

    async evaluadores(req,res){

        try{

            const data=await AsignacionService.getEvaluadores();

            res.json({

                ok:true,
                data

            });

        }catch(err){

            console.error(err);

            res.status(500).json({

                ok:false

            });

        }

    },

    async crear(req,res){

        try{

            const {

                proyectoId,
                evaluadorId

            }=req.body;

            const id=await AsignacionService.crear(

                proyectoId,
                evaluadorId

            );

            res.json({

                ok:true,
                id

            });

        }catch(err){

            console.error(err);

            res.status(400).json({

                ok:false,
                mensaje:err.message

            });

        }

    },

    async eliminar(req,res){

        try{

            await AsignacionService.eliminar(

                req.params.id

            );

            res.json({

                ok:true

            });

        }catch(err){

            console.error(err);

            res.status(500).json({

                ok:false

            });

        }

    }

};

module.exports = controller;
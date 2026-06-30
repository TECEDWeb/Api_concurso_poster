const RubricaService = require('../services/rubricaService');

class RubricaController {

    static async listar(req, res) {
        try {

            const rubricas = await RubricaService.listar();

            res.json(rubricas);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message: error.message
            });

        }
    }

    static async obtener(req, res) {

        try {

            const concursoId = parseInt(req.params.concursoId);

            const rubrica = await RubricaService.obtener(concursoId);

            if (!rubrica) {

                return res.status(404).json({
                    success: false,
                    message: 'Rúbrica no encontrada'
                });

            }

            res.json(rubrica);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message: error.message
            });

        }

    }

}

module.exports = RubricaController;
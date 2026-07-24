module.exports = {
  ENTIDAD_CERTIFICA: 'CENTRO DE INVESTIGACIÓN E INNOVACIÓN DE SISTEMAS Y TELECOMUNICACIONES',
  UNIVERSIDAD: 'Universidad Estatal Península de Santa Elena',
  LUGAR_DEFAULT: 'La Libertad',

  // Firmantes institucionales por defecto. Se pueden sobreescribir
  // enviando un array "firmantes" en el body de /certificados/generar.
  FIRMANTES_DEFAULT: [
    {
      nombre: 'Ing. Freddy Villao Santos, M.Sc.',
      titulo: 'DIRECTOR DEL INSTITUTO DE INVESTIGACIÓN CIENTÍFICA Y DESARROLLO DE TECNOLOGÍAS'
    },
    {
      nombre: 'Ing. Washington Torres, Mgt.',
      titulo: 'DECANO DE LA FACULTAD DE SISTEMAS Y TELECOMUNICACIONES'
    },
    {
      nombre: 'Ing. Marcia Bayas Sampedro, Ph.D.',
      titulo: 'DIRECTORA DEL CENTRO DE INVESTIGACIÓN E INNOVACIÓN DE SISTEMAS Y TELECOMUNICACIONES - CIST'
    }
  ],

  // Rutas de los logos institucionales. Si el archivo no existe,
  // el PDF cae automáticamente a un respaldo en texto sin romperse.
  LOGOS: {
    cist: __dirname + '/../assets/logo-cist.png',
    upse: __dirname + '/../assets/logo-upse.png'
  }
};
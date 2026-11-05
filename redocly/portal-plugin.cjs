// Decorators propios del portal: ajustes de presentación que no son parte del contrato de
// la API, así que viven acá y no en el servicio (el openapi.json de apis/ se reemplaza
// entero en cada export).
//
// Se exporta como objeto (no como función) a propósito: este redocly.yaml también lo lee
// la versión de @redocly/openapi-core que trae redocusaurus, que solo entiende ese formato.
module.exports = {
  id: 'portal',
  decorators: {
    oas3: {
      // Agrupa los tags en secciones del menú lateral de Redoc.
      'tag-groups': ({groups}) => ({
        Root: {
          leave(root) {
            root['x-tagGroups'] = groups;
          },
        },
      }),
    },
  },
};

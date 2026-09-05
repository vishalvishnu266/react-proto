import type en from './en';

// Spanish translations. Typed against the English resource shape so any
// missing / extra keys become a TypeScript error.
const es: typeof en = {
  welcome: 'Bienvenido',
  toggleTheme: 'Cambiar Tema',
  toggleLang: 'Switch to EN',
  nav: {
    home: 'Inicio',
    about: 'Acerca de',
    contact: 'Contacto',
    settings: 'Ajustes',
  },
  home: {
    title: 'Inicio',
    intro:
      'Esta es la página de inicio. Prueba a cambiar el tema y el idioma desde Ajustes.',
    goAbout: 'Ir a Acerca de',
    goContact: 'Ir a Contacto',
  },
  about: {
    title: 'Acerca de',
    body:
      'Esta página cuenta un poco sobre nuestra aplicación. Cambia el idioma para ver que este texto también cambia.',
  },
  contact: {
    title: 'Contacto',
    body:
      'Contáctanos cuando quieras. Este texto también debería traducirse al cambiar de idioma.',
    email: 'Correo electrónico',
    phone: 'Teléfono',
  },
  settings: {
    title: 'Ajustes',
    appearance: 'Apariencia',
    theme: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    language: 'Idioma',
    languageEn: 'Inglés',
    languageEs: 'Español',
    languageTa: 'Tamil',
    developer: 'Desarrollador',
    devMode: 'Modo dev',
    devModeHint:
      'Activa funciones solo para desarrolladores y registros adicionales en toda la aplicación.',
  },
  dev: {
    on: 'Modo dev ACTIVADO',
    off: 'Modo dev DESACTIVADO',
  },
};

export default es;

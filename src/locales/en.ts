// English translations. This file is the "source of truth" for the shape of
// our translation resources — TypeScript infers types from `en` and applies
// them to every other language via module augmentation (see `src/i18n.ts`).
const en = {
  welcome: 'Welcome',
  toggleTheme: 'Toggle Theme',
  toggleLang: 'Switch to ES',
  nav: {
    home: 'Home',
    about: 'About',
    contact: 'Contact',
    settings: 'Settings',
  },
  home: {
    title: 'Home',
    intro:
      'This is the home page. Try toggling the theme and language from Settings.',
    goAbout: 'Go to About',
    goContact: 'Go to Contact',
  },
  about: {
    title: 'About',
    body:
      'This page tells you a little about our app. Toggle the language to see this text change.',
  },
  contact: {
    title: 'Contact',
    body:
      'Reach out to us any time. This text should also be translated when you switch languages.',
    email: 'Email',
    phone: 'Phone',
  },
  settings: {
    title: 'Settings',
    appearance: 'Appearance',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    language: 'Language',
    languageEn: 'English',
    languageEs: 'Spanish',
    languageTa: 'Tamil',
    developer: 'Developer',
    devMode: 'Dev mode',
    devModeHint:
      'Enables developer-only features and extra logging across the app.',
  },
  dev: {
    on: 'Dev mode is ON',
    off: 'Dev mode is OFF',
  },
};

export default en;
export type Resources = { translation: typeof en };

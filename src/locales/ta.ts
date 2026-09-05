import type en from './en';

// Tamil translations. Typed against the English resource shape so any
// missing / extra keys become a TypeScript error.
const ta: typeof en = {
  welcome: 'வரவேற்கிறோம்',
  toggleTheme: 'தீம் மாற்று',
  toggleLang: 'Switch to EN',
  nav: {
    home: 'முகப்பு',
    about: 'எங்களை பற்றி',
    contact: 'தொடர்பு',
    settings: 'அமைப்புகள்',
  },
  home: {
    title: 'முகப்பு',
    intro:
      'இது முகப்பு பக்கம். மேலே உள்ள அமைப்புகளில் இருந்து தீமையும் மொழியையும் மாற்றி முயற்சிக்கவும்.',
    goAbout: 'எங்களை பற்றி பக்கத்திற்கு செல்',
    goContact: 'தொடர்பு பக்கத்திற்கு செல்',
  },
  about: {
    title: 'எங்களை பற்றி',
    body:
      'இந்த பக்கம் எங்கள் பயன்பாட்டைப் பற்றி சிறிது கூறுகிறது. மொழியை மாற்றி இந்த உரை மாறுவதைப் பாருங்கள்.',
  },
  contact: {
    title: 'தொடர்பு',
    body:
      'எப்போது வேண்டுமானாலும் எங்களை தொடர்பு கொள்ளுங்கள். மொழியை மாற்றும்போது இந்த உரையும் மொழிபெயர்க்கப்பட வேண்டும்.',
    email: 'மின்னஞ்சல்',
    phone: 'தொலைபேசி',
  },
  settings: {
    title: 'அமைப்புகள்',
    appearance: 'தோற்றம்',
    theme: 'தீம்',
    themeLight: 'வெளிச்சம்',
    themeDark: 'இருள்',
    language: 'மொழி',
    languageEn: 'ஆங்கிலம்',
    languageEs: 'ஸ்பானிஷ்',
    languageTa: 'தமிழ்',
    developer: 'டெவலப்பர்',
    devMode: 'டெவ் பயன்முறை',
    devModeHint:
      'டெவலப்பர் மட்டும் பயன்படுத்தும் அம்சங்களையும் கூடுதல் பதிவுகளையும் செயல்படுத்துகிறது.',
  },
  dev: {
    on: 'டெவ் பயன்முறை இயக்கத்தில்',
    off: 'டெவ் பயன்முறை நிறுத்தப்பட்டது',
  },
};

export default ta;

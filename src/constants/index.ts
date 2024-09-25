import {Platform} from 'react-native';
import {VISION_API_KEY} from '@env';

export const Colors = {
  white: '#ffffff',
  whiteTransparent: '#ffffff59',
  black: '#000000',
  selected: '#2581be82',
  highlighted: '#ffffff47',
  dark: '#252b2f',
  blue: '#559cff',
};

export const Icons = {
  search: require('../icons/search.png'),
  flash: require('../icons/flash.png'),
  flash_off: require('../icons/no_flash.png'),
  scan_outline: require('../icons/scan_outline.png'),
  qr_code: require('../icons/qr_code.png'),
};

export const API_KEY = VISION_API_KEY;

export const isIos = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

export const AppScreens = Object.freeze({
  CameraScreen: 'CameraScreen',
  GoogleLens: 'GoogleLens',
  ScanScreen: 'ScanScreen',
});

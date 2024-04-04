import {Platform} from 'react-native';

export const Colors = {
  white: '#ffffff',
  whiteTransparent: '#ffffff59',
  black: '#000000',
  selected: '#2581be82',
  highlighted: '#ffffff47',
  dark: '#252b2f',
};

export const Icons = {
  search: require('../icons/search.png'),
  flash: require('../icons/flash.png'),
  flash_off: require('../icons/no_flash.png'),
  scan_outline: require('../icons/scan_outline.png'),
  qr_code: require('../icons/qr_code.png'),
};

export const API_KEY = '';

export const isIos = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

export enum AppScreens {
  CameraScreen = 'CameraScreen',
  GoogleLens = 'GoogleLens',
  ScanScreen = 'ScanScreen',
}

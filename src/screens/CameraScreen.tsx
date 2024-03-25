import {
  View,
  Pressable,
  StyleSheet,
  Vibration,
  Animated,
  PixelRatio,
  Dimensions,
  Text,
  Linking,
} from 'react-native';
import React, {memo, useCallback, useRef, useState} from 'react';
import {Camera, Code, useCameraDevice} from 'react-native-vision-camera';
import {AppScreens, Colors, Icons} from '../constants';
import FastImage from 'react-native-fast-image';
import {Polygon, Svg} from 'react-native-svg';
import {ScreenProps} from '../routes/types';
import CameraScanner from '../components/CameraScanner';

/////Types
type LensProps = {
  onImageCapture: (image: string) => void;
};
type ControlProps = {};

/////constants
const SmsRegex = /^SMSTO:(\+[0-9]+):(.+)$/;
const WifiRegex = /^WIFI:S:([^;]+);T:([^;]+);P:([^;]+);H:(true|false);?$/;
const pixel = PixelRatio.get();
const screenHeight = Dimensions.get('screen').height;
const screenWidth = Dimensions.get('window').width;
const permission = Camera.getCameraPermissionStatus();
let interval: any;

/////functions
const OpenUrl = async (url: string) => {
  // console.log(url);
  try {
    let ModifiedUrl = '';
    const match = url.match(SmsRegex);
    const match1 = url.match(WifiRegex);
    console.log(match1);

    if (url?.toLowerCase()?.includes('http')) {
      ModifiedUrl = url;
    } else if (match && match.length === 3) {
      const phoneNumber = match[1];
      const messageBody = match[2];
      ModifiedUrl = `sms:${phoneNumber}?body=${encodeURIComponent(
        messageBody,
      )}`;
    } else if (match1 && match1.length === 5) {
      console.log('called');

      const ssid = match1[1];
      const securityType = match1[2];
      const password = match1[3];
      const hidden = match1[4] === 'true' ? true : false;
      ModifiedUrl = `wifi:${ssid}?password=${encodeURIComponent(
        password,
      )}&hidden=${hidden}`;
    } else {
      ModifiedUrl = url;
    }

    console.log(ModifiedUrl);
    // return;
    await Linking.openURL(ModifiedUrl);
  } catch (error) {
    console.log(error);
  }
};

/////components
const Controls = memo((props: ControlProps) => {
  return (
    <View style={styles.lowerContainer}>
      <Text style={styles.selectableText}>{'Search'}</Text>
    </View>
  );
});

/////Main Screen
const CameraScreen = ({}: ScreenProps<AppScreens.CameraScreen>) => {
  const onImageCapture = useCallback(() => {}, []);

  return (
    <View style={styles.app}>
      <CameraScanner onImageCapture={onImageCapture} />
      <Controls />
    </View>
  );
};

/////styles
const styles = StyleSheet.create({
  app: {flex: 1, backgroundColor: Colors.dark},
  noCamera: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerCamera: {
    flex: 1,
    marginBottom: 5,
    borderBottomStartRadius: 40,
    borderBottomEndRadius: 40,
    overflow: 'hidden',
  },
  noCameraText: {color: Colors.white},
  capture: {
    bottom: 25,
    alignSelf: 'center',
    position: 'absolute',
    width: 70,
    padding: 3,
    height: 70,
    borderWidth: 2,
    borderRadius: 35,
    borderColor: Colors.white,
    backgroundColor: Colors.whiteTransparent,
  },
  searchInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 35,
    backgroundColor: Colors.white,
  },
  search: {height: 25, width: 25},
  qr: {
    borderWidth: 2,
    borderColor: Colors.white,
    borderRadius: 8,
    position: 'absolute',
    height: 0,
    width: 0,
  },
  text: {
    position: 'absolute',
    backgroundColor: Colors.white,
    borderRadius: 8,
    flexShrink: 1,
    color: Colors.black,
    padding: 10,
    pointerEvents: 'box-only',
  },
  lowerContainer: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  selectableText: {
    color: Colors.white,
    borderWidth: 1,
    borderRadius: 20,
    borderColor: Colors.white,
    paddingVertical: 3,
    paddingHorizontal: 15,
    textAlign: 'center',
    // textAlignVertical: 'center',
    fontWeight: '500',
  },
  topContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
  },
  Jen: {
    textAlign: 'center',
    fontSize: 20,
    color: Colors.white,
    fontWeight: '600',
    textShadowColor: Colors.dark,
  },
});

export default memo(CameraScreen);

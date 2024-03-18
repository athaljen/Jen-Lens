import {
  View,
  Pressable,
  StyleSheet,
  Vibration,
  Animated,
  PixelRatio,
  Dimensions,
  TextInput,
  Text,
  Linking,
} from 'react-native';
import React, {memo, useCallback, useRef, useState} from 'react';
import {Camera, Code, useCameraDevice} from 'react-native-vision-camera';
import {Colors, Icons} from './constants';
import FastImage from 'react-native-fast-image';
import {Polygon, Svg} from 'react-native-svg';
const pixel = PixelRatio.get();

const screenHeight = Dimensions.get('screen').height;
const screenWidth = Dimensions.get('window').width;

const permission = Camera.getCameraPermissionStatus();

type LensProps = {
  onImageCapture: (image: string) => void;
};

const OpenUrl = (url: string) => {
  try {
    Linking.openURL(url);
  } catch (error) {
    console.log(error);
  }
};

let interval: any;

const LensCamera = ({onImageCapture}: LensProps) => {
  const [Permission, setPermission] = useState(permission);
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);
  const svgPath = useRef<any>(null);
  const top = useRef(new Animated.Value(0)).current;
  const left = useRef(new Animated.Value(0)).current;
  const width = useRef(new Animated.Value(0)).current;

  const [Code, setCode] = useState<string>();

  const onCodeScanned = useCallback(
    (codes: Code[]) => {
      const data = codes[0];
      if (
        data.frame?.height &&
        data.frame.width &&
        data.frame.x &&
        data.frame.y &&
        data?.corners
      ) {
        ///clear previous timeout
        clearTimeout(interval);
        ///clean qr uiu if no code visible
        interval = setTimeout(() => {
          svgPath.current?.setNativeProps({points: '0,0 0,0 0,0 0,0'});
          setCode(undefined);
        }, 1000);

        ///calculations
        let {corners, frame, value} = data;
        if (Code != value) {
          setCode(value);
        }
        let l = screenWidth - frame?.y / 1.65 - frame.width / 2.3;
        let t = frame?.x / 1.5;
        let w = frame.width / 1.6;
        let h = frame.height / 1.6;

        ///for pressable text
        top.setValue(t + h / 2.5);
        left.setValue(l - w / 3);
        width.setValue(w);

        ///set svg from corners
        const points = corners
          .map(coord => `${screenWidth - coord.y / 1.63},${coord.x / 1.5}`)
          .join(' ');
        svgPath.current?.setNativeProps({points: points});
      }
    },
    [Code],
  );

  const askForPermission = useCallback(async () => {
    try {
      const response = await Camera.requestCameraPermission();
      setPermission(response);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const CaptureImage = useCallback(async () => {
    try {
      Vibration.vibrate(80);
      const image = await cameraRef.current?.takePhoto({
        enableShutterSound: false,
      });
      if (onImageCapture && image?.path) onImageCapture(`file://${image.path}`);
    } catch (error) {
      console.log(error);
    }
  }, []);

  if (!device || Permission !== 'granted') {
    return (
      <View style={styles.noCamera}>
        <Text style={styles.noCameraText} onPress={askForPermission}>
          {!device ? 'Unable to access device camera...' : 'Give Camera Access'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.app}>
      <Camera
        ref={cameraRef}
        device={device}
        style={styles.app}
        resizeMode="cover"
        photo
        isActive
        enableZoomGesture
        codeScanner={{
          codeTypes: ['qr', 'ean-13'],
          onCodeScanned,
        }}
      />
      <Svg style={{position: 'absolute', flex: 1}}>
        <Polygon
          ref={svgPath}
          points={'0,0 0,0 0,0 0,0'}
          fill="transparent"
          stroke={Colors.white}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeWidth={3}></Polygon>
      </Svg>

      {Code ? (
        <Animated.Text
          onPress={OpenUrl.bind(null, Code)}
          numberOfLines={1}
          style={[styles.text, {top: top, left: left, width: width}]}>
          {Code}
        </Animated.Text>
      ) : null}
      <Pressable
        onPress={CaptureImage}
        style={({pressed}) => [
          styles.capture,
          {transform: [{scale: pressed ? 0.9 : 1}]},
        ]}>
        <View style={styles.searchInner}>
          <FastImage
            style={styles.search}
            source={Icons.search}
            resizeMode="contain"
          />
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  app: {flex: 1},
  noCamera: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noCameraText: {color: Colors.white},
  capture: {
    bottom: 50,
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
    padding: 5,
  },
});

export default memo(LensCamera);

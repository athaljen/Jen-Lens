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

const SmsRegex = /^SMSTO:(\+[0-9]+):(.+)$/;
const WifiRegex = /^WIFI:S:([^;]+);T:([^;]+);P:([^;]+);H:(true|false);?$/;

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

        let w = frame.width / (pixel - 1);

        ///for pressable text
        const minX = Math.min(...corners.map(point => point.x));
        const minY = Math.min(...corners.map(point => point.y));

        top.setValue(minX / (pixel - 1) + frame.height / 3.8);
        left.setValue(screenWidth - minY / (pixel - 0.85) - frame.width / 1.6);
        width.setValue(w);

        ///set svg from corners
        const points = corners
          .map((coord, index) => {
            return `${
              screenWidth -
              (coord.y - ([2, 3].includes(index) ? -20 : 20)) / (pixel - 0.85)
            },${
              (coord.x - ([2, 1].includes(index) ? -20 : 20)) / (pixel - 0.99)
            }`;
          })
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
      <View style={styles.containerCamera}>
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
        <Svg style={{position: 'absolute', flex: 1}} pointerEvents="none">
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
      <View style={styles.lowerContainer}>
        <Text style={styles.selectableText}>{'Search'}</Text>
      </View>
    </View>
  );
};

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
});

export default memo(LensCamera);

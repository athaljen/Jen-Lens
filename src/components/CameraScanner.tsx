import {
  View,
  Pressable,
  StyleSheet,
  Animated,
  PixelRatio,
  Dimensions,
  Text,
  Linking,
} from 'react-native';
import React, {
  memo,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {Camera, Code, useCameraDevice} from 'react-native-vision-camera';
import {Colors, Icons} from '../constants';
import FastImage from 'react-native-fast-image';
import {Polygon, Svg} from 'react-native-svg';
import ViewShot from 'react-native-view-shot';

/////Types
type Props = {
  cameraRef: RefObject<Camera>;
  viewShotRef: RefObject<ViewShot>;
};

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

/////Main component
const CameraScanner = ({cameraRef, viewShotRef}: Props) => {
  const device = useCameraDevice('back');

  const svgPath = useRef<any>(null);
  const top = useRef(new Animated.Value(0)).current;
  const left = useRef(new Animated.Value(0)).current;
  const width = useRef(new Animated.Value(0)).current;

  const [Permission, setPermission] = useState(permission);
  const [Code, setCode] = useState<string>();
  const [Flash, setFlash] = useState(false);

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

  useEffect(() => {
    askForPermission();
  }, []);

  const toggleFlash = useCallback(() => {
    if (device) setFlash(p => !p && (device?.hasFlash || device?.hasTorch));
  }, [device]);

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
    <View style={styles.cameraComp}>
      <ViewShot style={styles.camera} ref={viewShotRef}>
        <View style={{backgroundColor: 'red', flex: 1}}>
          <Camera
            ref={cameraRef}
            device={device}
            style={styles.camera}
            resizeMode="cover"
            torch={Flash ? 'on' : 'off'}
            photo
            isActive
            enableZoomGesture
            codeScanner={{
              codeTypes: ['qr', 'ean-13'],
              onCodeScanned,
            }}
          />
          <Svg style={styles.svg} pointerEvents="none">
            <Polygon
              ref={svgPath}
              points={'0,0 0,0 0,0 0,0'}
              fill="transparent"
              stroke={Colors.white}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeWidth={3}
            />
          </Svg>
        </View>
      </ViewShot>

      <View style={styles.topContainer}>
        <Text style={styles.Jen}>{'Jen Lens'}</Text>
        <Pressable onPress={toggleFlash}>
          <FastImage
            source={Flash ? Icons.flash : Icons.flash_off}
            style={styles.flash}
            resizeMode="contain"
            tintColor={Colors.white}
          />
        </Pressable>
      </View>

      {Code ? (
        <Animated.Text
          onPress={OpenUrl.bind(null, Code)}
          numberOfLines={1}
          style={[styles.text, {top: top, left: left, width: width}]}>
          {Code}
        </Animated.Text>
      ) : (
        <FastImage
          source={Icons.scan_outline}
          style={styles.scanOutline}
          resizeMode="contain"
        />
      )}
    </View>
  );
};

/////styles
const styles = StyleSheet.create({
  camera: {flex: 1},
  cameraComp: {
    flex: 1,
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 25,
    overflow: 'hidden',
  },
  noCamera: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  svg: {position: 'absolute', flex: 1},
  containerCamera: {
    flex: 1,
    marginBottom: 5,
    borderBottomStartRadius: 40,
    borderBottomEndRadius: 40,
    overflow: 'hidden',
  },
  scanOutline: {
    height: screenWidth / 1.3,
    width: screenWidth / 1.3,
    alignSelf: 'center',
    position: 'absolute',
    top: screenHeight / 3.5,
  },
  noCameraText: {color: Colors.white},
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
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  Jen: {
    fontSize: 20,
    color: Colors.white,
    fontWeight: '600',
    textShadowColor: Colors.dark,
    flex: 1,
    textAlign: 'center',
    marginLeft: 25,
  },
  flash: {height: 25, width: 25},
});

export default memo(CameraScanner);

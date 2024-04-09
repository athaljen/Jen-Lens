import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Pressable,
  Vibration,
} from 'react-native';
import React, {memo, useCallback, useEffect, useRef, useState} from 'react';
import {AppScreens, Colors, Icons, isAndroid} from '../constants';
import {ScreenProps} from '../routes/types';
import CameraScanner from '../components/CameraScanner';
import FastImage from 'react-native-fast-image';
import {Camera} from 'react-native-vision-camera';
import ViewShot from 'react-native-view-shot';

///types
type ControlProps = {
  onImageCapture: (type: ActionType) => void;
};

type ActionType = 'Scan' | 'Search';

/////components
const Controls = memo(({onImageCapture}: ControlProps) => {
  const [Type, setType] = useState<ActionType>('Scan');

  const handleTypeChange = useCallback(() => {
    Vibration.vibrate(50);
    setType(prev => (prev === 'Scan' ? 'Search' : 'Scan'));
  }, []);

  return (
    <>
      <Pressable
        onPress={onImageCapture.bind(null, Type)}
        style={({pressed}) => [
          styles.capture,
          {transform: [{scale: pressed ? 0.9 : 1}]},
        ]}>
        <View style={styles.searchInner}>
          <FastImage
            style={styles.search}
            source={Type === 'Scan' ? Icons.qr_code : Icons.search}
            resizeMode="stretch"
          />
        </View>
      </Pressable>

      <View style={styles.lowerContainer}>
        <Pressable
          onPress={handleTypeChange}
          style={[
            styles.selectable,
            {
              backgroundColor:
                Type === 'Search' ? Colors.selected : Colors.dark,
            },
          ]}>
          <FastImage
            source={Icons.search}
            style={styles.smallIcon}
            resizeMode="contain"
            tintColor={Colors.white}
          />
          <Text style={styles.selectableText}>{'Search'}</Text>
        </Pressable>
        <Pressable
          onPress={handleTypeChange}
          style={[
            styles.selectable,
            {backgroundColor: Type === 'Scan' ? Colors.selected : Colors.dark},
          ]}>
          <FastImage
            source={Icons.qr_code}
            style={styles.smallIcon}
            resizeMode="contain"
            tintColor={Colors.white}
          />
          <Text style={styles.selectableText}>{'Scan'}</Text>
        </Pressable>
      </View>
    </>
  );
});

/////Main Screen
const CameraScreen = ({navigation}: ScreenProps<AppScreens.CameraScreen>) => {
  const cameraRef = useRef<Camera>(null);
  const viewShotRef = useRef<ViewShot>(null);

  const onImageCapture = useCallback(async (type: ActionType) => {
    try {
      if (type === 'Scan' && viewShotRef.current?.capture) {
        const image = await viewShotRef.current?.capture();
        navigation.navigate(AppScreens.ScanScreen, {image: image});
      } else if (type === 'Search') {
        const image = await cameraRef.current?.takePhoto({
          enableAutoDistortionCorrection: true,
          enableAutoStabilization: true,
          qualityPrioritization: 'quality',
        });
        if (!image) return;
        const formatImage = `${isAndroid ? 'file://' : 'file:/'}${image.path}`;
        navigation.navigate(AppScreens.GoogleLens, {image: formatImage});
      }
    } catch (error) {}
  }, []);

  return (
    <View style={styles.app}>
      <CameraScanner cameraRef={cameraRef} viewShotRef={viewShotRef} />
      <Controls onImageCapture={onImageCapture} />
    </View>
  );
};

/////styles
const styles = StyleSheet.create({
  app: {flex: 1, backgroundColor: Colors.dark},
  lowerContainer: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  scrollView: {backgroundColor: 'red'},
  selectable: {
    borderWidth: 1,
    borderRadius: 20,
    borderColor: Colors.white,
    paddingVertical: 3,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallIcon: {height: 15, width: 15, marginRight: 10},
  selectableText: {
    color: Colors.white,
    textAlign: 'center',
    fontWeight: '500',
    margin: 0,
    marginBottom: 1,
  },
  capture: {
    bottom: 80,
    alignSelf: 'center',
    position: 'absolute',
    padding: 4,
    width: 80,
    height: 80,
    borderWidth: 2,
    borderRadius: 50,
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
  search: {height: 23, width: 23},
});

export default memo(CameraScreen);

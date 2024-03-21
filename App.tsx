'use strict';
import React, {memo, useState} from 'react';
import {SafeAreaView, StatusBar, StyleSheet, View} from 'react-native';
import GoogleLens from './src/GoogleLens';
import LensCamera from './src/LensCamera';

const App = () => {
  const [Image, setImage] = useState<string | undefined>();

  return (
    <View style={styles.app}>
      <StatusBar translucent backgroundColor={'transparent'} />
      {Image ? (
        <GoogleLens image={Image} />
      ) : (
        <LensCamera onImageCapture={setImage} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  app: {flex: 1},
});

export default memo(App);

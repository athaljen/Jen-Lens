'use strict';
import React, {memo, useState} from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import GoogleLens from './src/GoogleLens';
import LensCamera from './src/LensCamera';

const App = () => {
  const [Image, setImage] = useState<string | undefined>();

  return (
    <SafeAreaView style={styles.app}>
      {Image ? (
        <GoogleLens image={Image} />
      ) : (
        <LensCamera onImageCapture={setImage} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  app: {flex: 1},
});

export default memo(App);

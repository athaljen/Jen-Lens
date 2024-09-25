'use strict;';
import React, {memo} from 'react';
import {StyleSheet, View} from 'react-native';
import {ScreenProps} from '../routes/types';
import {AppScreens, Colors} from '../constants';
import FastImage from 'react-native-fast-image';

const ScanScreen = ({route}: ScreenProps<'ScanScreen'>) => {
  const {image} = route.params;

  return (
    <View style={styles.ScanScreen}>
      <FastImage
        style={styles.ScanScreen}
        resizeMode="stretch"
        source={{uri: image}}
      />
      <View style={{height: 150}}></View>
    </View>
  );
};

const styles = StyleSheet.create({
  ScanScreen: {
    flex: 1,
    backgroundColor: Colors.dark,
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 25,
  },
});

export default memo(ScanScreen);

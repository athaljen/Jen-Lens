'use strict';
import React, {memo, useEffect} from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import {Colors} from './src/constants';
import Root from './src/routes/Root';
import SplashScreen from 'react-native-splash-screen';

const App = () => {
  useEffect(() => {
    setTimeout(() => {
      SplashScreen.hide();
    }, 1000);
  }, []);

  return (
    <View style={styles.app}>
      <StatusBar translucent backgroundColor={'transparent'} />
      <Root />
    </View>
  );
};

const styles = StyleSheet.create({
  app: {flex: 1, backgroundColor: Colors.dark},
});

export default memo(App);

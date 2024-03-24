'use strict';
import React, {memo} from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import {Colors} from './src/constants';
import Root from './src/routes/Root';

const App = () => {
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

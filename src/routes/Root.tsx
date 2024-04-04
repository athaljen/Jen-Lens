import React, {memo} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import {AppScreens} from '../constants';
import CameraScreen from '../screens/CameraScreen';
import GoogleLens from '../screens/GoogleLens';
import ScanScreen from '../screens/ScanScreen';

export type StackParams = {
  [AppScreens.CameraScreen]: undefined;
  [AppScreens.GoogleLens]: {image: string};
  [AppScreens.ScanScreen]: {image: string};
};

export type RootNavigation = NativeStackNavigationProp<StackParams>;

const Stack = createNativeStackNavigator<StackParams>();

const Root = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name={AppScreens.CameraScreen} component={CameraScreen} />
        <Stack.Screen name={AppScreens.ScanScreen} component={ScanScreen} />
        <Stack.Screen name={AppScreens.GoogleLens} component={GoogleLens} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default memo(Root);

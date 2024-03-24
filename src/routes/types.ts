import {RouteProp} from '@react-navigation/native';
import {RootNavigation, StackParams} from './Root';

export type ScreenProps<S extends keyof StackParams = keyof StackParams> = {
  navigation: RootNavigation;
  route: RouteProp<StackParams, S>;
};

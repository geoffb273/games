import { Text as MockText } from 'react-native';

// Reanimated depends on Worklets; in Jest there is no native runtime, so use the mock.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));

require('react-native-reanimated').setUpTests();

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: jest.fn(({ name, ...rest }) => <MockText {...rest}>{name}</MockText>),
}));

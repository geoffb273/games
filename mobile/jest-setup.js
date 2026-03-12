// Reanimated depends on Worklets; in Jest there is no native runtime, so use the mock.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));

require('react-native-reanimated').setUpTests();

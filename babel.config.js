module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'nativewind/babel',
      // react-native-reanimated/plugin is automatically included by babel-preset-expo in Expo SDK 53
    ],
  };
};
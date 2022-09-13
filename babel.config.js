module.exports = {
  presets: [
    'module:metro-react-native-babel-preset',
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: [
          '.ios.ts',
          '.android.ts',
          '.ts',
          '.ios.tsx',
          '.android.tsx',
          '.tsx',
          '.jsx',
          '.js',
          '.json',
        ],
        alias: {
          '@': './src',
          "@assets": "./src/assets",
          "@components": "./src/components",
          "@constants": "./src/constants",
          "@hooks": "./src/hooks",
          "@modules": "./src/modules",
          "@pages": "./src/pages",
        },
      },
    ],
  ],
};

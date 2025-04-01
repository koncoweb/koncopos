module.exports = function (api) {
  api.cache(true);

  const plugins = [];

  if (process.env.EXPO_PUBLIC_TEMPO) {
    plugins.push(["tempo-devtools/dist/babel-plugin"]);
  }

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins,
  };
};

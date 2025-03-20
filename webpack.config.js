const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/index.tsx",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
    alias: {
      src: path.resolve(__dirname, "src"), // Alias `src` directly
      "src/components": path.resolve(__dirname, "src/components"),

    },
  },
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
    }),
  ],
  devServer: {
    static: "./dist",
    hot: true,
  },
  mode: "development",
};

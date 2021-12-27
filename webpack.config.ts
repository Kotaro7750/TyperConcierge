import path from 'path';
import { Configuration } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const isDev = process.env.NODE_ENV === 'development';

const common: Configuration = {
  mode: isDev ? 'development' : 'production',
  node: {
    // メインプロセス内の__dirnameや__filenameをwebpackが変換しないようにする
    __dirname: false,
    __filename: false
  },

  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
  },

  output: {
    path: path.resolve(__dirname, 'dist')
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /noe_modules/,
        loader: 'ts-loader'
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.svg$/,
        loader: 'url-loader',
      }
    ]
  },

  watch: isDev,
  devtool: isDev ? 'inline-source-map' : undefined
};


// メインプロセス向け設定
const main: Configuration = {
  ...common,
  target: 'electron-main',
  entry: {
    main: './src/main/main.ts',
  },
};

// プリロードスクリプト向け設定
const preload: Configuration = {
  ...common,
  target: 'electron-preload',
  entry: {
    preload: './src/main/preload.ts',
  },
};

// レンダラープロセス向け設定
const renderer: Configuration = {
  ...common,
  target: 'web',
  entry: {
    renderer: './src/renderer/main.tsx',
  },
  plugins: [
    new HtmlWebpackPlugin({
      minify: !isDev,
      inject: 'body',
      filename: 'index.html',
      template: './src/renderer/index.html',
    }),
  ],
};

const config = isDev ? [renderer] : [main, preload, renderer];
export default config;

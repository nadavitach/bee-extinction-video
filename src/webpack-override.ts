import type { Configuration } from "webpack";

export const webpackOverride: Configuration = {
  resolve: {
    fallback: {
      fs: false,
      path: false,
      crypto: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        type: "asset/source",
      },
    ],
  },
};
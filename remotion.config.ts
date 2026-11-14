import { Config } from "@remotion/cli/config";
import { webpackOverride } from "./src/webpack-override";

Config.setVideoImageFormat("png");
Config.setPublicDir("public");
Config.setOverwriteOutput(true);

const originalGetWebpackConfig = Config.getWebpackConfig;
Config.getWebpackConfig = () => {
  const config = originalGetWebpackConfig();
  return webpackOverride(config);
};
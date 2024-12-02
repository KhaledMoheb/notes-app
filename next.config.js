const path = require("path");  // Import path to use resolve for aliasing
const rawLoader = require("raw-loader");  // Make sure raw-loader is installed

module.exports = {
  webpack(config) {
    // Add raw-loader rule for .esdl files
    config.module.rules.push({
      test: /\.esdl$/,
      use: "raw-loader", // Process .esdl files as raw text
    });

    // Resolve @dbschema alias to the local dbschema folder
    config.resolve.alias = {
      ...config.resolve.alias,
      '@dbschema': path.resolve(__dirname, 'dbschema'),
    };

    return config;
  },
};

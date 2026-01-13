const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable all update-related requests
config.server = {
  port: 8081,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Block update manifest requests
      if (req.url && (
        req.url.includes('manifest') ||
        req.url.includes('update') ||
        req.url.includes('expoUpdates')
      )) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ updateAvailable: false }));
        return;
      }
      return middleware(req, res, next);
    };
  },
};

// Ensure no transformation of update-related code
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
  },
};

module.exports = config;

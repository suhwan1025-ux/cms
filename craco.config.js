const { styles } = require('@ckeditor/ckeditor5-dev-utils');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // CKEditor 5 CSS 처리를 위한 규칙 추가
      const oneOfRule = webpackConfig.module.rules.find(rule => rule.oneOf);
      
      if (oneOfRule) {
        const ckeditorRule = {
          test: /ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/,
          use: ['raw-loader']
        };
        
        const ckeditorCssRule = {
          test: /ckeditor5-[^/\\]+[/\\]theme[/\\].+\.css$/,
          use: [
            {
              loader: 'style-loader',
              options: {
                injectType: 'singletonStyleTag',
                attributes: {
                  'data-cke': true
                }
              }
            },
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: styles.getPostCssConfig({
                  themeImporter: {
                    themePath: require.resolve('@ckeditor/ckeditor5-theme-lark')
                  },
                  minify: true
                })
              }
            }
          ]
        };

        // CKEditor 관련 규칙을 oneOf 배열의 시작 부분에 추가
        oneOfRule.oneOf.unshift(ckeditorRule, ckeditorCssRule);
      }

      return webpackConfig;
    }
  }
}; 
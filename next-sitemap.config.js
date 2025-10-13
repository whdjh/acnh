/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://acnh-gules.vercel.app",
  generateRobotsTxt: true,
  changefreq: "weekly",
  priority: 0.7,
  exclude: [],
  additionalPaths: async (config) => {
    const result = [];
    // 브랜드 페이지를 명시적으로 포함
    result.push(await config.transform(config, "/brand/tamsldogam"));
    return result;
  },
};

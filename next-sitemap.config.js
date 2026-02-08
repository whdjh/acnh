/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://acnh-gules.vercel.app',
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  exclude: [],
  additionalPaths: async (config) => [
    await config.transform(config, '/'),
    await config.transform(config, '/en'),
    await config.transform(config, '/brand/tamsldogam'),
    await config.transform(config, '/en/brand/tamsldogam'),
    await config.transform(config, '/list'),
    await config.transform(config, '/en/list'),
  ],
}

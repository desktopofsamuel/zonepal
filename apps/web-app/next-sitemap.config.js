import config from './config.js';

/** @type {import('next-sitemap').IConfig} */
export default {
  siteUrl: config.DOMAIN,
  generateRobotsTxt: true, // (optional)
  // ...other options
}
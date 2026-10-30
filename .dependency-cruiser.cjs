module.exports = {
  forbidden: [
    { name: "no-cycles", severity: "error", from: {}, to: { circular: true } },
    { name: "domain-is-pure", severity: "error", from: { path: "^src/domain" }, to: { path: "^src/(modules|infrastructure|app|server)" } },
    { name: "repositories-do-not-use-http", severity: "error", from: { path: "repository\\.js$" }, to: { path: "(routes|app|server)\\.js$" } },
    { name: "services-do-not-use-routes", severity: "error", from: { path: "service\\.js$" }, to: { path: "routes\\.js$" } }
  ],
  options: { doNotFollow: { path: "node_modules" }, exclude: "node_modules" }
};

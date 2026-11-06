const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// Keep the shared Mobile API on PORT (3000) and serve the Business web on 5174.
process.env.PORT = process.env.BUSINESS_WEB_PORT || "5174";
process.env.HOST = process.env.BUSINESS_WEB_HOST || "127.0.0.1";
process.env.BUSINESS_WEB_SERVER = "true";

require("../src/server");

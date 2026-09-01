import type { MetadataRoute } from "next";

// The landing screen links to /admin in the footer, which is enough for a crawler
// to find and index the login page — "Suhbat admin panel" turning up in search
// results is free reconnaissance for anyone looking for a password prompt to
// hammer, and an odd thing for a customer to stumble into. The pages also send
// `robots: noindex` in their own metadata; this covers the crawlers that read
// robots.txt before requesting anything.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin",
    },
  };
}

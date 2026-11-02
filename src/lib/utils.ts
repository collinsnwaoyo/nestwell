import { createCn } from "cn/config";

/**
 * Class merging that knows the project's type scale and shadows. Without
 * this, `text-stat-sm text-positive` reads as two colours and the size is
 * dropped.
 */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "h2", "h3", "body", "meta", "meta-style", "stat", "stat-sm", "th"] }],
      shadow: [{ shadow: ["1", "2", "3"] }],
    },
  },
});

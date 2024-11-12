import { type ClientSchema, a, defineFunction } from "@aws-amplify/backend";

const fetchAllGNews = defineFunction({
  name: "fetchAllGNews",
  schedule: "every 8h",
});

export const gnewsFetchAll = fetchAllGNews;

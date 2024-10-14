/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const extractUrls = /* GraphQL */ `
  query ExtractUrls($url: String) {
    extractUrls(url: $url)
  }
`;
export const getArticle = /* GraphQL */ `
  query GetArticle($id: ID!) {
    getArticle(id: $id) {
      articleId
      createdAt
      feed {
        createdAt
        description
        feedId
        id
        name
        owner
        tags
        type
        updatedAt
        url
        websiteId
        __typename
      }
      feedId
      fullText
      id
      owner
      summaries {
        nextToken
        __typename
      }
      tags
      title
      updatedAt
      url
      __typename
    }
  }
`;
export const getFeed = /* GraphQL */ `
  query GetFeed($id: ID!) {
    getFeed(id: $id) {
      articles {
        nextToken
        __typename
      }
      createdAt
      description
      feedId
      id
      name
      owner
      tags
      type
      updatedAt
      url
      website {
        category
        createdAt
        id
        name
        owner
        tags
        updatedAt
        url
        websiteId
        __typename
      }
      websiteId
      __typename
    }
  }
`;
export const getSummarizer = /* GraphQL */ `
  query GetSummarizer($id: ID!) {
    getSummarizer(id: $id) {
      createdAt
      description
      id
      name
      owner
      summaries {
        nextToken
        __typename
      }
      summarizerId
      tags
      tier
      updatedAt
      __typename
    }
  }
`;
export const getSummary = /* GraphQL */ `
  query GetSummary($id: ID!) {
    getSummary(id: $id) {
      article {
        articleId
        createdAt
        feedId
        fullText
        id
        owner
        tags
        title
        updatedAt
        url
        __typename
      }
      articleId
      createdAt
      id
      owner
      summarizer {
        createdAt
        description
        id
        name
        owner
        summarizerId
        tags
        tier
        updatedAt
        __typename
      }
      summarizerId
      summaryId
      tags
      text
      updatedAt
      __typename
    }
  }
`;
export const getWebsite = /* GraphQL */ `
  query GetWebsite($id: ID!) {
    getWebsite(id: $id) {
      category
      createdAt
      feeds {
        nextToken
        __typename
      }
      id
      name
      owner
      tags
      updatedAt
      url
      websiteId
      __typename
    }
  }
`;
export const listArticles = /* GraphQL */ `
  query ListArticles(
    $filter: ModelArticleFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listArticles(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        articleId
        createdAt
        feedId
        fullText
        id
        owner
        tags
        title
        updatedAt
        url
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const listFeeds = /* GraphQL */ `
  query ListFeeds(
    $filter: ModelFeedFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listFeeds(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        createdAt
        description
        feedId
        id
        name
        owner
        tags
        type
        updatedAt
        url
        websiteId
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const listSummaries = /* GraphQL */ `
  query ListSummaries(
    $filter: ModelSummaryFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSummaries(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        articleId
        createdAt
        id
        owner
        summarizerId
        summaryId
        tags
        text
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const listSummarizers = /* GraphQL */ `
  query ListSummarizers(
    $filter: ModelSummarizerFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSummarizers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        createdAt
        description
        id
        name
        owner
        summarizerId
        tags
        tier
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const listWebsites = /* GraphQL */ `
  query ListWebsites(
    $filter: ModelWebsiteFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listWebsites(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        category
        createdAt
        id
        name
        owner
        tags
        updatedAt
        url
        websiteId
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const sayHello = /* GraphQL */ `
  query SayHello($name: String) {
    sayHello(name: $name)
  }
`;
export const summarize = /* GraphQL */ `
  query Summarize($text: String) {
    summarize(text: $text)
  }
`;

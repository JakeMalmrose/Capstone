/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateArticle = /* GraphQL */ `
  subscription OnCreateArticle(
    $filter: ModelSubscriptionArticleFilterInput
    $owner: String
  ) {
    onCreateArticle(filter: $filter, owner: $owner) {
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
export const onCreateFeed = /* GraphQL */ `
  subscription OnCreateFeed(
    $filter: ModelSubscriptionFeedFilterInput
    $owner: String
  ) {
    onCreateFeed(filter: $filter, owner: $owner) {
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
        __typename
      }
      websiteId
      __typename
    }
  }
`;
export const onCreateSummarizer = /* GraphQL */ `
  subscription OnCreateSummarizer(
    $filter: ModelSubscriptionSummarizerFilterInput
    $owner: String
  ) {
    onCreateSummarizer(filter: $filter, owner: $owner) {
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
export const onCreateSummary = /* GraphQL */ `
  subscription OnCreateSummary(
    $filter: ModelSubscriptionSummaryFilterInput
    $owner: String
  ) {
    onCreateSummary(filter: $filter, owner: $owner) {
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
export const onCreateWebsite = /* GraphQL */ `
  subscription OnCreateWebsite(
    $filter: ModelSubscriptionWebsiteFilterInput
    $owner: String
  ) {
    onCreateWebsite(filter: $filter, owner: $owner) {
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
      __typename
    }
  }
`;
export const onDeleteArticle = /* GraphQL */ `
  subscription OnDeleteArticle(
    $filter: ModelSubscriptionArticleFilterInput
    $owner: String
  ) {
    onDeleteArticle(filter: $filter, owner: $owner) {
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
export const onDeleteFeed = /* GraphQL */ `
  subscription OnDeleteFeed(
    $filter: ModelSubscriptionFeedFilterInput
    $owner: String
  ) {
    onDeleteFeed(filter: $filter, owner: $owner) {
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
        __typename
      }
      websiteId
      __typename
    }
  }
`;
export const onDeleteSummarizer = /* GraphQL */ `
  subscription OnDeleteSummarizer(
    $filter: ModelSubscriptionSummarizerFilterInput
    $owner: String
  ) {
    onDeleteSummarizer(filter: $filter, owner: $owner) {
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
export const onDeleteSummary = /* GraphQL */ `
  subscription OnDeleteSummary(
    $filter: ModelSubscriptionSummaryFilterInput
    $owner: String
  ) {
    onDeleteSummary(filter: $filter, owner: $owner) {
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
export const onDeleteWebsite = /* GraphQL */ `
  subscription OnDeleteWebsite(
    $filter: ModelSubscriptionWebsiteFilterInput
    $owner: String
  ) {
    onDeleteWebsite(filter: $filter, owner: $owner) {
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
      __typename
    }
  }
`;
export const onUpdateArticle = /* GraphQL */ `
  subscription OnUpdateArticle(
    $filter: ModelSubscriptionArticleFilterInput
    $owner: String
  ) {
    onUpdateArticle(filter: $filter, owner: $owner) {
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
export const onUpdateFeed = /* GraphQL */ `
  subscription OnUpdateFeed(
    $filter: ModelSubscriptionFeedFilterInput
    $owner: String
  ) {
    onUpdateFeed(filter: $filter, owner: $owner) {
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
        __typename
      }
      websiteId
      __typename
    }
  }
`;
export const onUpdateSummarizer = /* GraphQL */ `
  subscription OnUpdateSummarizer(
    $filter: ModelSubscriptionSummarizerFilterInput
    $owner: String
  ) {
    onUpdateSummarizer(filter: $filter, owner: $owner) {
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
export const onUpdateSummary = /* GraphQL */ `
  subscription OnUpdateSummary(
    $filter: ModelSubscriptionSummaryFilterInput
    $owner: String
  ) {
    onUpdateSummary(filter: $filter, owner: $owner) {
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
export const onUpdateWebsite = /* GraphQL */ `
  subscription OnUpdateWebsite(
    $filter: ModelSubscriptionWebsiteFilterInput
    $owner: String
  ) {
    onUpdateWebsite(filter: $filter, owner: $owner) {
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
      __typename
    }
  }
`;

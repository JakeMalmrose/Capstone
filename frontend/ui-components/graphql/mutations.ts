/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createArticle = /* GraphQL */ `
  mutation CreateArticle(
    $condition: ModelArticleConditionInput
    $input: CreateArticleInput!
  ) {
    createArticle(condition: $condition, input: $input) {
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
export const createFeed = /* GraphQL */ `
  mutation CreateFeed(
    $condition: ModelFeedConditionInput
    $input: CreateFeedInput!
  ) {
    createFeed(condition: $condition, input: $input) {
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
export const createSummarizer = /* GraphQL */ `
  mutation CreateSummarizer(
    $condition: ModelSummarizerConditionInput
    $input: CreateSummarizerInput!
  ) {
    createSummarizer(condition: $condition, input: $input) {
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
export const createSummary = /* GraphQL */ `
  mutation CreateSummary(
    $condition: ModelSummaryConditionInput
    $input: CreateSummaryInput!
  ) {
    createSummary(condition: $condition, input: $input) {
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
export const createWebsite = /* GraphQL */ `
  mutation CreateWebsite(
    $condition: ModelWebsiteConditionInput
    $input: CreateWebsiteInput!
  ) {
    createWebsite(condition: $condition, input: $input) {
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
export const deleteArticle = /* GraphQL */ `
  mutation DeleteArticle(
    $condition: ModelArticleConditionInput
    $input: DeleteArticleInput!
  ) {
    deleteArticle(condition: $condition, input: $input) {
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
export const deleteFeed = /* GraphQL */ `
  mutation DeleteFeed(
    $condition: ModelFeedConditionInput
    $input: DeleteFeedInput!
  ) {
    deleteFeed(condition: $condition, input: $input) {
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
export const deleteSummarizer = /* GraphQL */ `
  mutation DeleteSummarizer(
    $condition: ModelSummarizerConditionInput
    $input: DeleteSummarizerInput!
  ) {
    deleteSummarizer(condition: $condition, input: $input) {
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
export const deleteSummary = /* GraphQL */ `
  mutation DeleteSummary(
    $condition: ModelSummaryConditionInput
    $input: DeleteSummaryInput!
  ) {
    deleteSummary(condition: $condition, input: $input) {
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
export const deleteWebsite = /* GraphQL */ `
  mutation DeleteWebsite(
    $condition: ModelWebsiteConditionInput
    $input: DeleteWebsiteInput!
  ) {
    deleteWebsite(condition: $condition, input: $input) {
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
export const updateArticle = /* GraphQL */ `
  mutation UpdateArticle(
    $condition: ModelArticleConditionInput
    $input: UpdateArticleInput!
  ) {
    updateArticle(condition: $condition, input: $input) {
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
export const updateFeed = /* GraphQL */ `
  mutation UpdateFeed(
    $condition: ModelFeedConditionInput
    $input: UpdateFeedInput!
  ) {
    updateFeed(condition: $condition, input: $input) {
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
export const updateSummarizer = /* GraphQL */ `
  mutation UpdateSummarizer(
    $condition: ModelSummarizerConditionInput
    $input: UpdateSummarizerInput!
  ) {
    updateSummarizer(condition: $condition, input: $input) {
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
export const updateSummary = /* GraphQL */ `
  mutation UpdateSummary(
    $condition: ModelSummaryConditionInput
    $input: UpdateSummaryInput!
  ) {
    updateSummary(condition: $condition, input: $input) {
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
export const updateWebsite = /* GraphQL */ `
  mutation UpdateWebsite(
    $condition: ModelWebsiteConditionInput
    $input: UpdateWebsiteInput!
  ) {
    updateWebsite(condition: $condition, input: $input) {
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

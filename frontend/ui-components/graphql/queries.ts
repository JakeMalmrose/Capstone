/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getFeed = /* GraphQL */ `
  query GetFeed($id: ID!) {
    getFeed(id: $id) {
      createdAt
      description
      id
      name
      owner
      type
      updatedAt
      url
      websiteId
      __typename
    }
  }
`;
export const getSummary = /* GraphQL */ `
  query GetSummary($id: ID!) {
    getSummary(id: $id) {
      articleUrl
      createdAt
      fullText
      id
      owner
      summary
      tags
      title
      updatedAt
      userId
      __typename
    }
  }
`;
export const getTodo = /* GraphQL */ `
  query GetTodo($id: ID!) {
    getTodo(id: $id) {
      content
      createdAt
      id
      owner
      updatedAt
      __typename
    }
  }
`;
export const getUser = /* GraphQL */ `
  query GetUser($id: ID!) {
    getUser(id: $id) {
      createdAt
      email
      favoriteFeeds
      id
      isAdmin
      owner
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
        id
        name
        owner
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
        articleUrl
        createdAt
        fullText
        id
        owner
        summary
        tags
        title
        updatedAt
        userId
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const listTodos = /* GraphQL */ `
  query ListTodos(
    $filter: ModelTodoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTodos(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        content
        createdAt
        id
        owner
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const listUsers = /* GraphQL */ `
  query ListUsers(
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUsers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        createdAt
        email
        favoriteFeeds
        id
        isAdmin
        owner
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
        __typename
      }
      nextToken
      __typename
    }
  }
`;

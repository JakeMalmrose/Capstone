/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateFeed = /* GraphQL */ `
  subscription OnCreateFeed(
    $filter: ModelSubscriptionFeedFilterInput
    $owner: String
  ) {
    onCreateFeed(filter: $filter, owner: $owner) {
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
export const onCreateSummary = /* GraphQL */ `
  subscription OnCreateSummary(
    $filter: ModelSubscriptionSummaryFilterInput
    $owner: String
  ) {
    onCreateSummary(filter: $filter, owner: $owner) {
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
export const onCreateTodo = /* GraphQL */ `
  subscription OnCreateTodo(
    $filter: ModelSubscriptionTodoFilterInput
    $owner: String
  ) {
    onCreateTodo(filter: $filter, owner: $owner) {
      content
      createdAt
      id
      owner
      updatedAt
      __typename
    }
  }
`;
export const onCreateUser = /* GraphQL */ `
  subscription OnCreateUser(
    $filter: ModelSubscriptionUserFilterInput
    $owner: String
  ) {
    onCreateUser(filter: $filter, owner: $owner) {
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
export const onCreateWebsite = /* GraphQL */ `
  subscription OnCreateWebsite(
    $filter: ModelSubscriptionWebsiteFilterInput
    $owner: String
  ) {
    onCreateWebsite(filter: $filter, owner: $owner) {
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
export const onDeleteFeed = /* GraphQL */ `
  subscription OnDeleteFeed(
    $filter: ModelSubscriptionFeedFilterInput
    $owner: String
  ) {
    onDeleteFeed(filter: $filter, owner: $owner) {
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
export const onDeleteSummary = /* GraphQL */ `
  subscription OnDeleteSummary(
    $filter: ModelSubscriptionSummaryFilterInput
    $owner: String
  ) {
    onDeleteSummary(filter: $filter, owner: $owner) {
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
export const onDeleteTodo = /* GraphQL */ `
  subscription OnDeleteTodo(
    $filter: ModelSubscriptionTodoFilterInput
    $owner: String
  ) {
    onDeleteTodo(filter: $filter, owner: $owner) {
      content
      createdAt
      id
      owner
      updatedAt
      __typename
    }
  }
`;
export const onDeleteUser = /* GraphQL */ `
  subscription OnDeleteUser(
    $filter: ModelSubscriptionUserFilterInput
    $owner: String
  ) {
    onDeleteUser(filter: $filter, owner: $owner) {
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
export const onDeleteWebsite = /* GraphQL */ `
  subscription OnDeleteWebsite(
    $filter: ModelSubscriptionWebsiteFilterInput
    $owner: String
  ) {
    onDeleteWebsite(filter: $filter, owner: $owner) {
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
export const onUpdateFeed = /* GraphQL */ `
  subscription OnUpdateFeed(
    $filter: ModelSubscriptionFeedFilterInput
    $owner: String
  ) {
    onUpdateFeed(filter: $filter, owner: $owner) {
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
export const onUpdateSummary = /* GraphQL */ `
  subscription OnUpdateSummary(
    $filter: ModelSubscriptionSummaryFilterInput
    $owner: String
  ) {
    onUpdateSummary(filter: $filter, owner: $owner) {
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
export const onUpdateTodo = /* GraphQL */ `
  subscription OnUpdateTodo(
    $filter: ModelSubscriptionTodoFilterInput
    $owner: String
  ) {
    onUpdateTodo(filter: $filter, owner: $owner) {
      content
      createdAt
      id
      owner
      updatedAt
      __typename
    }
  }
`;
export const onUpdateUser = /* GraphQL */ `
  subscription OnUpdateUser(
    $filter: ModelSubscriptionUserFilterInput
    $owner: String
  ) {
    onUpdateUser(filter: $filter, owner: $owner) {
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
export const onUpdateWebsite = /* GraphQL */ `
  subscription OnUpdateWebsite(
    $filter: ModelSubscriptionWebsiteFilterInput
    $owner: String
  ) {
    onUpdateWebsite(filter: $filter, owner: $owner) {
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

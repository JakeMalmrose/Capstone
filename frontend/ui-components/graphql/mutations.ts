/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createFeed = /* GraphQL */ `
  mutation CreateFeed(
    $condition: ModelFeedConditionInput
    $input: CreateFeedInput!
  ) {
    createFeed(condition: $condition, input: $input) {
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
export const createSummary = /* GraphQL */ `
  mutation CreateSummary(
    $condition: ModelSummaryConditionInput
    $input: CreateSummaryInput!
  ) {
    createSummary(condition: $condition, input: $input) {
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
export const createTodo = /* GraphQL */ `
  mutation CreateTodo(
    $condition: ModelTodoConditionInput
    $input: CreateTodoInput!
  ) {
    createTodo(condition: $condition, input: $input) {
      content
      createdAt
      id
      owner
      updatedAt
      __typename
    }
  }
`;
export const createUser = /* GraphQL */ `
  mutation CreateUser(
    $condition: ModelUserConditionInput
    $input: CreateUserInput!
  ) {
    createUser(condition: $condition, input: $input) {
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
export const createWebsite = /* GraphQL */ `
  mutation CreateWebsite(
    $condition: ModelWebsiteConditionInput
    $input: CreateWebsiteInput!
  ) {
    createWebsite(condition: $condition, input: $input) {
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
export const deleteFeed = /* GraphQL */ `
  mutation DeleteFeed(
    $condition: ModelFeedConditionInput
    $input: DeleteFeedInput!
  ) {
    deleteFeed(condition: $condition, input: $input) {
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
export const deleteSummary = /* GraphQL */ `
  mutation DeleteSummary(
    $condition: ModelSummaryConditionInput
    $input: DeleteSummaryInput!
  ) {
    deleteSummary(condition: $condition, input: $input) {
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
export const deleteTodo = /* GraphQL */ `
  mutation DeleteTodo(
    $condition: ModelTodoConditionInput
    $input: DeleteTodoInput!
  ) {
    deleteTodo(condition: $condition, input: $input) {
      content
      createdAt
      id
      owner
      updatedAt
      __typename
    }
  }
`;
export const deleteUser = /* GraphQL */ `
  mutation DeleteUser(
    $condition: ModelUserConditionInput
    $input: DeleteUserInput!
  ) {
    deleteUser(condition: $condition, input: $input) {
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
export const deleteWebsite = /* GraphQL */ `
  mutation DeleteWebsite(
    $condition: ModelWebsiteConditionInput
    $input: DeleteWebsiteInput!
  ) {
    deleteWebsite(condition: $condition, input: $input) {
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
export const updateFeed = /* GraphQL */ `
  mutation UpdateFeed(
    $condition: ModelFeedConditionInput
    $input: UpdateFeedInput!
  ) {
    updateFeed(condition: $condition, input: $input) {
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
export const updateSummary = /* GraphQL */ `
  mutation UpdateSummary(
    $condition: ModelSummaryConditionInput
    $input: UpdateSummaryInput!
  ) {
    updateSummary(condition: $condition, input: $input) {
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
export const updateTodo = /* GraphQL */ `
  mutation UpdateTodo(
    $condition: ModelTodoConditionInput
    $input: UpdateTodoInput!
  ) {
    updateTodo(condition: $condition, input: $input) {
      content
      createdAt
      id
      owner
      updatedAt
      __typename
    }
  }
`;
export const updateUser = /* GraphQL */ `
  mutation UpdateUser(
    $condition: ModelUserConditionInput
    $input: UpdateUserInput!
  ) {
    updateUser(condition: $condition, input: $input) {
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
export const updateWebsite = /* GraphQL */ `
  mutation UpdateWebsite(
    $condition: ModelWebsiteConditionInput
    $input: UpdateWebsiteInput!
  ) {
    updateWebsite(condition: $condition, input: $input) {
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

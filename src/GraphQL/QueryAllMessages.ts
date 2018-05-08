import gql from 'graphql-tag'

export default gql(`
query listMessages {
  listMessages {
    items {
      title
      id
      createdTime
    }
  }
}`)

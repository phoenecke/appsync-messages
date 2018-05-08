import gql from 'graphql-tag'

export default gql`
  mutation createMessage($title: String!) {
    createMessage(input: { title: $title }) {
      id
      title
      createdTime
    }
  }
`

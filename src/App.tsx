import { ApolloLink } from 'apollo-link'
import { onError } from 'apollo-link-error'
import AWSAppSyncClient, { createAppSyncLink } from 'aws-appsync'
import { Rehydrated } from 'aws-appsync-react'
import * as React from 'react'
import { ApolloProvider } from 'react-apollo'
import appSyncConfig from './AppSync'

import Messages from './Messages'

const onErrorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.map(({ message, locations, path }) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    )
  }
  if (networkError) {
    console.log(`[Network error]: ${networkError}`)
  }
})

const appSyncLink = createAppSyncLink({
  auth: {
    apiKey: appSyncConfig.apiKey,
    type: appSyncConfig.authenticationType,
  },
  region: appSyncConfig.region,
  url: appSyncConfig.graphqlEndpoint,
})

const link = ApolloLink.from([onErrorLink, appSyncLink])

const client = new AWSAppSyncClient({}, { link })

const WithProvider = () => (
  <ApolloProvider client={client}>
    <Rehydrated>
      <Messages />
    </Rehydrated>
  </ApolloProvider>
)

export default WithProvider

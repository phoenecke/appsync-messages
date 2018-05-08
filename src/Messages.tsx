import sortBy = require('lodash/sortBy')
import * as React from 'react'
import { compose, graphql } from 'react-apollo'
import uuid = require('uuid/v4')
import CreateMessage from './GraphQL/CreateMessage'
import QueryAllMessages from './GraphQL/QueryAllMessages'
import SubscriptionNewMessages from './GraphQL/SubscriptionNewMessages'

export interface IMessage {
  id?: string
  title: string
  createdTime?: string
}

export interface IMessageConnection {
  items: IMessage[]
}

export interface IProps {
  messages: IMessage[]
  subscribeToNewMessages: () => () => void
  onAdd: (message: string) => void
}

export interface IState {
  inputValue: string
}

export interface IResult {
  listMessages: IMessageConnection
}

class Messages extends React.Component<IProps, IState> {
  public state = {
    inputValue: '',
  }

  private unsubscribe: () => void

  public componentWillUnmount() {
    this.unsubscribe()
  }
  public componentWillMount() {
    this.unsubscribe = this.props.subscribeToNewMessages()
  }

  public render() {
    const { messages } = this.props
    return (
      <div>
        <div className="messages">
          {messages.map(m => <div key={m.id}>{m.title}</div>)}
        </div>
        <form onSubmit={this.submit}>
          <input
            value={this.state.inputValue}
            type="text"
            onChange={this.onInputChange}
          />
        </form>
      </div>
    )
  }

  private onInputChange = (e: React.FormEvent<HTMLInputElement>) => {
    this.setState({
      inputValue: e.currentTarget.value,
    })
  }

  private submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    this.props.onAdd(this.state.inputValue)
    this.setState({ inputValue: '' })
  }
}

export default compose(
  graphql(CreateMessage, {
    props: ({ mutate }) => ({
      onAdd: (message: string) => {
        if (mutate) {
          const tempId = uuid()
          mutate({
            optimisticResponse: {
              __typename: 'Mutation',
              createMessage: {
                __typename: 'Message',
                createdTime: new Date().toISOString(),
                id: tempId,
                title: message,
              },
            },
            update: (proxy, { data }) => {
              const createMessage = data ? data.createMessage : null
              const d = proxy.readQuery({ query: QueryAllMessages }) as IResult
              d.listMessages.items = d.listMessages.items.filter(
                i => i.id !== tempId
              )
              d.listMessages.items.push(createMessage)
              proxy.writeQuery({ query: QueryAllMessages, data: d })
            },
            variables: { title: message },
          })
        }
      },
    }),
  }),
  graphql<{}, IResult, {}, {}>(QueryAllMessages, {
    options: {
      fetchPolicy: 'cache-and-network',
    },
    props: ({ data }) => {
      return {
        messages: sortBy(
          data && data.listMessages ? data.listMessages.items : [],
          'createdTime'
        ),
        subscribeToNewMessages: () => {
          if (data) {
            data.subscribeToMore({
              document: SubscriptionNewMessages,
              updateQuery: (
                prev,
                {
                  subscriptionData: {
                    data: { onCreateMessage },
                  },
                }
              ) => {
                const message: IMessage = onCreateMessage as IMessage
                // Should return prev here if message is not a full IMessage...
                // or fill out the message with defaults?
                return {
                  ...prev,
                  listMessages: {
                    __typename: 'MessageConnection',
                    items: [
                      message,
                      ...(prev as IResult).listMessages.items.filter(
                        (m: IMessage) => m.id !== message.id
                      ),
                    ],
                  },
                }
              },
            })
          }
        },
      }
    },
  })
)(Messages)

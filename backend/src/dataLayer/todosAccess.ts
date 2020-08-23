import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoUpdate } from '../models/TodoUpdate'

const XAWS = AWSXRay.captureAWS(AWS)

import { TodoItem } from '../models/TodoItem'

const todosTable = process.env.TODOS_TABLE
const userIndex = process.env.USER_ID_INDEX

export class TodoAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE) {
  }
  
  async getTodosForUser(userId: String) {
    const result = await this.docClient.query({
      TableName : todosTable,
      IndexName : userIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
          ':userId': userId
      },

      ScanIndexForward: false
    }).promise()

    return result.Items;
  }

  async getTodoById(todoId: String): Promise<TodoItem> {
    const result = await this.docClient.query({
      TableName : todosTable,
      KeyConditionExpression: 'todoId = :todoId',
      ExpressionAttributeValues: {
          ':todoId': todoId
      },

      ScanIndexForward: false
    }).promise()

    const item = result.Items[0];
    return item as TodoItem;
  }

  async updateTodo(updateTodo: TodoUpdate,todoId: String) {
    await this.docClient.update({
      TableName: todosTable,
          Key: {
              todoId: todoId
          },
          UpdateExpression: 'set #namefield = :n, dueDate = :d, done = :done',
          ExpressionAttributeValues: {
              ':n': updateTodo.name,
              ':d': updateTodo.dueDate,
              ':done': updateTodo.done
          },
          ExpressionAttributeNames: {
              "#namefield": "name"
          }
    }).promise()
  }

  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    await this.docClient.put({
      TableName: this.todosTable,
      Item: todoItem
    }).promise()

    return todoItem
  }

  async setAttachmentUrl(
    todoId: string,
    attachmentUrl: string,
  ): Promise<void> {
    this.docClient
        .update({
            TableName: this.todosTable,
            Key: {
                todoId
            },
            UpdateExpression: 'set attachmentUrl = :attachmentUrl',
            ExpressionAttributeValues: {
                ':attachmentUrl': attachmentUrl,
            },
            ReturnValues: 'UPDATED_NEW',
        })
        .promise();
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}

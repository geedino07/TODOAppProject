import * as AWS from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
// import { TodoUpdate } from '../models/TodoUpdate';
var AWSXRay = require('aws-xray-sdk');

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class TodosAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly todosIndex = process.env.INDEX_NAME
    ){}

    async getAllTodos(userId: string): Promise<TodoItem[]>{
        logger.info('Get all todos function called-datalayer')

        const result = await this.docClient
        .query({
            TableName: this.todosTable,
            IndexName: this.todosIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        })
        .promise()

        const items = result.Items
        return items as TodoItem[]
    }

    async createTodoItem(todoItem: TodoItem): Promise<TodoItem>{
        logger.info('create todo item function called-datalayer')

        const result = await this.docClient
        .put({ TableName: this.todosTable, Item: todoItem })
        .promise()
        logger.info('Implemented new todo item', result)
        return todoItem as TodoItem
    }

    async updateTodoItem(
        todoId: string, userId: string, todoUpdate: TodoUpdate ): Promise<TodoUpdate> 
        { logger.info('Úpdate todo item function called at dl')
        const result = await this.docClient
        .update({
            TableName: this.todosTable,
            Key: {todoId, userId },
            UpdateExpression: 'set #name= :name, dueDate = :dueDate, done = :done',
            ExpressionAttributeValues: {
                ':name': todoUpdate.name,
                ':dueDate': todoUpdate.dueDate, 
                ':done': todoUpdate.done },
            ExpressionAttributeNames: {'#name': 'name'},
            ReturnValues: 'ALL_NEW'
        })
        .promise()
        const todoItemUpdate  = result.Attributes
        logger.info ('Update successful for Todo Item', todoItemUpdate) 
        return todoItemUpdate as TodoUpdate
    }

    async deleteTodoItem(todoId: string, userId: string): Promise<string> {
        logger.info(`Delete todo item function at dl with todoId: ${todoId} and userId: ${userId}`)

        const result = await this.docClient
        .delete({ TableName: this.todosTable, Key: {todoId, userId}})
        .promise()
        logger.info('Todo Item deleted', result, todoId)
        return todoId as string
    }

    async updateTodoAttachmentUrl( todoId: string, userId: string, attachmentUrl: string,): 
    Promise<void>{ logger.info('update todo attachment url function at datalayer')
        await this.docClient
        .update({
            TableName: this.todosTable,
            Key: {todoId, userId },
            UpdateExpression: 'set attachmentUrl = :attachmentUrl',
            ExpressionAttributeValues: {
                ':attachmentUrl': attachmentUrl
            }
        }).promise()
    }
}
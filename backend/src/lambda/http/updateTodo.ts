import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import { TodoUpdate } from '../../models/TodoUpdate'
import { createLogger } from '../../utils/logger'
import { getTodoById,updateTodofn } from '../../businessLogic/todo'
import { getUserId } from '../utils'

const logger = createLogger('auth')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    
    console.log("EVENT:", event);
    const todoId = event.pathParameters.todoId
    const updateTodo: TodoUpdate = JSON.parse(event.body)

    logger.info("update todo id ", todoId);

    if(todoId === null) {
        return {
            statusCode: 404,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'TodoId is required'
            })
        }
    }

    const todo = await getTodoById(todoId);

    logger.info("todo item to be updated found ", todo);

    const userId = getUserId(event);

    if(todo.userId !== userId) {
        return {
            statusCode: 403,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'This user is not the owner of the todo item'
            })
        }
    }
    
    await updateTodofn(updateTodo,todoId);
    
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            updateTodo
        })
    }
}
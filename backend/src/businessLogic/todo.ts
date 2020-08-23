import * as uuid from 'uuid'

import { TodoItem } from '../models/TodoItem'
import { TodoAccess } from '../dataLayer/todosAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { getUserId } from '../lambda/utils'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { TodoUpdate } from '../models/TodoUpdate'

const todoAccess = new TodoAccess()

export async function getTodoById(todoId: String) {
  return todoAccess.getTodoById(todoId);
}

export async function updateTodofn(updateTodo: TodoUpdate,todoId: String) {
  return todoAccess.updateTodo(updateTodo,todoId);
}

export async function getTodosForUser(
  event: APIGatewayProxyEvent
) {
  const userId = getUserId(event);

  return todoAccess.getTodosForUser(userId);
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  event: APIGatewayProxyEvent
): Promise<TodoItem> {

  const itemId = uuid.v4()
  const userId = getUserId(event)

  return await todoAccess.createTodo({
    userId: userId,
    todoId: itemId,
    createdAt: new Date().toISOString(),
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: false
  })
}

export async function setAttachmentUrl(
  todoId: string,
  attachmentUrl: string,
): Promise<void> {
  const todo = await todoAccess.getTodoById(todoId);

  todoAccess.setAttachmentUrl(todo.todoId, attachmentUrl);
}
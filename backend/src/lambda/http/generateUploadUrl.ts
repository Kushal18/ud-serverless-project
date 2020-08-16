import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import * as uuid from '../../../node_modules/uuid'
import * as AWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import { setAttachmentUrl } from '../../businessLogic/todo';
import { parseUserId } from '../../auth/utils';
import { createLogger } from '../../utils/logger';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

const logger = createLogger('uploadTodoUrl');

const XAWS = AWSXRay.captureAWS(AWS);
let options: AWS.S3.Types.ClientConfiguration = {
    signatureVersion: 'v4',
};
const s3 = new XAWS.S3(options);

const bucketName = process.env.IMAGES_S3_BUCKET;
const urlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION);

function getUploadUrl(imageId: string): string {
    return s3.getSignedUrl('putObject', {
        Bucket: bucketName,
        Key: imageId,
        Expires: urlExpiration,
    });
}

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
try {
    const todoId = event.pathParameters.todoId
  logger.info('Generate upload url', event);
  // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
  const authorization = event.headers.Authorization;
  const split = authorization.split(' ');
  const jwtToken = split[1];
  const userId = parseUserId(jwtToken);

    const imageId = uuid.v4();
    logger.info(`upload Todo ${todoId} url for user ${userId}`);
    setAttachmentUrl(
        todoId,
        `https://${bucketName}.s3.amazonaws.com/${imageId}`
    );

    const uploadUrl = getUploadUrl(imageId);

    return {
        statusCode: 201,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
          },
        body: JSON.stringify({
            uploadUrl,
        }),
    };
} catch (error) {
    return {
        statusCode: 500,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
          },
        body: JSON.stringify({
            error,
        }),
    };
}
  
})

handler.use(
    cors({
      credentials: true
    })
  )
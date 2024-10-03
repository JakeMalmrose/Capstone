import json
import boto3
import os

lambda_client = boto3.client('lambda')

def lambda_handler(event, context):
    feed_id = event['pathParameters']['feed_id']
    
    # Assume we have a function to get feed URL from feed_id
    feed_url = get_feed_url(feed_id)
    
    response = lambda_client.invoke(
        FunctionName=os.environ['RSS_PARSER_FUNCTION_NAME'],
        InvocationType='RequestResponse',
        Payload=json.dumps({'feed_url': feed_url})
    )
    
    articles = json.loads(response['Payload'].read())
    
    return {
        'statusCode': 200,
        'body': json.dumps(articles)
    }

def get_feed_url(feed_id):
    # Implementation to get feed URL from feed_id
    # This could involve a database lookup
    pass
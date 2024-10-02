import json
import boto3
import uuid
import os
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['FEED_TABLE_NAME']
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    try:
        # Parse the input
        feed_info = json.loads(event['body'])
        
        # Validate input
        required_fields = ['name', 'url']
        for field in required_fields:
            if field not in feed_info:
                return {
                    'statusCode': 400,
                    'body': json.dumps({"error": f"Missing required field: {field}"})
                }
        
        # Check if the feed URL already exists
        try:
            response = table.scan(
                FilterExpression=Attr('url').eq(feed_info['url'])
            )
        except ClientError as e:
            return {
                'statusCode': 500,
                'body': json.dumps({"error": f"Database operation failed: {str(e)}"})
            }

        if response['Items']:
            return {
                'statusCode': 409,
                'body': json.dumps({"error": "Feed with this URL already exists"})
            }
        
        # Generate a unique ID for the feed
        feed_info['id'] = str(uuid.uuid4())
        
        # Add the feed to the table
        try:
            table.put_item(Item=feed_info)
        except ClientError as e:
            return {
                'statusCode': 500,
                'body': json.dumps({"error": f"Failed to add item to database: {str(e)}"})
            }
        
        return {
            'statusCode': 201,
            'body': json.dumps({
                'message': 'Feed added successfully',
                'feed': feed_info
            })
        }
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'body': json.dumps({"error": "Invalid JSON in request body"})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({"error": f"An unexpected error occurred: {str(e)}"})
        }
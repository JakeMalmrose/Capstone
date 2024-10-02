import json
import boto3
import os
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['FEED_TABLE_NAME']
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    try:
        # Scan the table to get all items
        response = table.scan()
        
        # Extract items from the response
        items = response.get('Items', [])
        
        # Check if there are more items (pagination)
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            items.extend(response.get('Items', []))
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Supported feeds retrieved successfully',
                'feeds': items
            }),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
    except ClientError as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': f"Database operation failed: {str(e)}"
            }),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': f"An unexpected error occurred: {str(e)}"
            }),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
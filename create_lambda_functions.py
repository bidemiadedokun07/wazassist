#!/usr/bin/env python3
"""
AWS Lambda Function Creator for TranscribeProj001
Creates 9 Lambda functions with proper configuration and environment variables
"""

import boto3
import json
import sys
import argparse
from pathlib import Path
from typing import Dict, List, Tuple
import subprocess
import os

class LambdaFunctionCreator:
    def __init__(self, region: str = "us-east-1"):
        self.region = region
        self.lambda_client = boto3.client('lambda', region_name=region)
        self.ssm_client = boto3.client('ssm', region_name=region)
        self.role_arn = "arn:aws:iam::877634772291:role/TranscribeProj001-lambda-role-dev"
        self.runtime = "python3.11"
        self.environment_vars: Dict[str, str] = {}
        
    def check_aws_credentials(self) -> bool:
        """Verify AWS credentials are configured"""
        try:
            sts = boto3.client('sts', region_name=self.region)
            sts.get_caller_identity()
            return True
        except Exception as e:
            print(f"❌ AWS credentials error: {e}")
            return False
    
    def retrieve_environment_variables(self) -> Dict[str, str]:
        """Retrieve environment variables from AWS Parameter Store"""
        env_vars = {
            'S3_BUCKET': 'customer-care-s3',
            'DYNAMODB_TABLE': 'TranscribeProj001-summaries-dev',
            'BEDROCK_MODEL_ID': 'us.meta.llama3-1-8b-instruct-v1:0',
            'MAX_TOKENS': '2048',
            'CONNECTIONS_TABLE': 'TranscribeProj001-connections-dev',
            'WEBSOCKET_ENDPOINT': 'https://your-api-id.execute-api.us-east-1.amazonaws.com/dev',
            'ENVIRONMENT': 'dev'
        }
        
        print(f"\n{'='*70}")
        print("Retrieving Environment Variables from AWS Parameter Store")
        print(f"{'='*70}\n")
        
        # Try to get values from Parameter Store
        for key in env_vars.keys():
            param_name = f"/transcribe/{key}"
            try:
                response = self.ssm_client.get_parameter(Name=param_name)
                env_vars[key] = response['Parameter']['Value']
                print(f"✓ Retrieved {key}: {env_vars[key]}")
            except self.ssm_client.exceptions.ParameterNotFound:
                print(f"⚠ {key} not found in Parameter Store, using default: {env_vars[key]}")
            except Exception as e:
                print(f"⚠ Error retrieving {key}: {e}, using default: {env_vars[key]}")
        
        self.environment_vars = env_vars
        return env_vars
    
    def verify_role_exists(self) -> bool:
        """Verify IAM role exists"""
        try:
            iam = boto3.client('iam')
            role_name = self.role_arn.split('/')[-1]
            iam.get_role(RoleName=role_name)
            print(f"✓ IAM Role exists: {role_name}")
            return True
        except Exception as e:
            print(f"❌ IAM Role error: {e}")
            return False
    
    def create_placeholder_zip(self, zip_path: str = "lambda-code.zip") -> bool:
        """Create a placeholder ZIP file for Lambda functions"""
        try:
            if os.path.exists(zip_path):
                print(f"Using existing ZIP file: {zip_path}")
                return True
            
            print(f"Creating placeholder ZIP file: {zip_path}")
            
            # Create a simple Python handler
            handler_code = '''
def lambda_handler(event, context):
    """Placeholder Lambda handler"""
    return {
        'statusCode': 200,
        'body': 'Lambda function placeholder'
    }
'''
            
            # Create ZIP using subprocess
            with open('lambda_handler_temp.py', 'w') as f:
                f.write(handler_code)
            
            result = subprocess.run(['zip', '-j', zip_path, 'lambda_handler_temp.py'], 
                                  capture_output=True, text=True)
            
            os.remove('lambda_handler_temp.py')
            
            if result.returncode == 0:
                print(f"✓ Created placeholder ZIP: {zip_path}")
                return True
            else:
                print(f"❌ Failed to create ZIP: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Error creating placeholder ZIP: {e}")
            return False
    
    def create_lambda_function(self, 
                              function_name: str,
                              handler: str,
                              timeout: int,
                              memory: int,
                              env_keys: List[str],
                              zip_path: str) -> Tuple[bool, str]:
        """Create a single Lambda function"""
        try:
            # Build environment variables for this function
            env_vars = {'ENVIRONMENT': self.environment_vars['ENVIRONMENT']}
            for key in env_keys:
                if key in self.environment_vars:
                    env_vars[key] = self.environment_vars[key]
            
            # Read ZIP file
            with open(zip_path, 'rb') as f:
                zip_content = f.read()
            
            # Create function
            response = self.lambda_client.create_function(
                FunctionName=function_name,
                Runtime=self.runtime,
                Role=self.role_arn,
                Handler=handler,
                Timeout=timeout,
                MemorySize=memory,
                Environment={'Variables': env_vars},
                Code={'ZipFile': zip_content},
                Tags={
                    'Project': 'TranscribeProj001',
                    'Environment': 'dev',
                    'ManagedBy': 'aws-cli'
                }
            )
            
            arn = response.get('FunctionArn', '')
            print(f"✓ Created: {function_name}")
            print(f"  ARN: {arn}")
            print(f"  Handler: {handler}, Timeout: {timeout}s, Memory: {memory}MB")
            return True, arn
            
        except self.lambda_client.exceptions.ResourceConflictException:
            print(f"⚠ Function already exists: {function_name}")
            return False, "Already exists"
        except Exception as e:
            print(f"❌ Error creating {function_name}: {str(e)}")
            return False, str(e)
    
    def create_all_functions(self, zip_path: str = "lambda-code.zip") -> Dict[str, bool]:
        """Create all 9 Lambda functions"""
        
        # Lambda function specifications
        functions = [
            {
                'name': 'TranscribeProj001-process-transcript-dev',
                'handler': 'process_transcript.handler',
                'timeout': 300,
                'memory': 256,
                'env': ['S3_BUCKET', 'DYNAMODB_TABLE']
            },
            {
                'name': 'TranscribeProj001-generate-summary-dev',
                'handler': 'generate_summary.handler',
                'timeout': 600,
                'memory': 512,
                'env': ['BEDROCK_MODEL_ID', 'MAX_TOKENS', 'DYNAMODB_TABLE']
            },
            {
                'name': 'TranscribeProj001-save-summary-dev',
                'handler': 'save_summary.handler',
                'timeout': 60,
                'memory': 256,
                'env': ['DYNAMODB_TABLE']
            },
            {
                'name': 'TranscribeProj001-update-status-dev',
                'handler': 'update_status.handler',
                'timeout': 60,
                'memory': 128,
                'env': ['DYNAMODB_TABLE']
            },
            {
                'name': 'TranscribeProj001-list-summaries-dev',
                'handler': 'list_summaries.handler',
                'timeout': 30,
                'memory': 256,
                'env': ['DYNAMODB_TABLE']
            },
            {
                'name': 'TranscribeProj001-get-summary-dev',
                'handler': 'get_summary.handler',
                'timeout': 30,
                'memory': 256,
                'env': ['DYNAMODB_TABLE', 'S3_BUCKET']
            },
            {
                'name': 'TranscribeProj001-ws-connect-dev',
                'handler': 'connect.handler',
                'timeout': 10,
                'memory': 128,
                'env': ['CONNECTIONS_TABLE']
            },
            {
                'name': 'TranscribeProj001-ws-disconnect-dev',
                'handler': 'disconnect.handler',
                'timeout': 10,
                'memory': 128,
                'env': ['CONNECTIONS_TABLE']
            },
            {
                'name': 'TranscribeProj001-ws-notify-dev',
                'handler': 'notify.handler',
                'timeout': 10,
                'memory': 128,
                'env': ['CONNECTIONS_TABLE', 'WEBSOCKET_ENDPOINT']
            },
        ]
        
        results = {}
        
        print(f"\n{'='*70}")
        print("Creating Lambda Functions")
        print(f"{'='*70}\n")
        
        for i, func_spec in enumerate(functions, 1):
            print(f"\n[{i}/{len(functions)}] Creating {func_spec['name']}...")
            success, message = self.create_lambda_function(
                function_name=func_spec['name'],
                handler=func_spec['handler'],
                timeout=func_spec['timeout'],
                memory=func_spec['memory'],
                env_keys=func_spec['env'],
                zip_path=zip_path
            )
            results[func_spec['name']] = success
        
        return results
    
    def verify_functions(self) -> None:
        """Verify all created functions"""
        print(f"\n{'='*70}")
        print("Verifying Created Lambda Functions")
        print(f"{'='*70}\n")
        
        try:
            response = self.lambda_client.list_functions()
            
            created_functions = [
                f for f in response['Functions']
                if 'TranscribeProj001-' in f['FunctionName'] and '-dev' in f['FunctionName']
            ]
            
            if created_functions:
                print(f"Found {len(created_functions)} TranscribeProj001-dev functions:\n")
                for func in created_functions:
                    print(f"  • {func['FunctionName']}")
                    print(f"    Memory: {func['MemorySize']}MB, Timeout: {func['Timeout']}s")
                    print(f"    Runtime: {func['Runtime']}")
                    print()
            else:
                print("No TranscribeProj001-dev functions found.")
                
        except Exception as e:
            print(f"Error verifying functions: {e}")
    
    def run(self, zip_path: str = "lambda-code.zip", create_zip: bool = True) -> int:
        """Run the complete process"""
        print("\n" + "="*70)
        print("AWS Lambda Function Creator - TranscribeProj001")
        print("="*70)
        
        # Step 1: Check credentials
        print("\nStep 1: Checking AWS credentials...")
        if not self.check_aws_credentials():
            return 1
        print("✓ AWS credentials valid")
        
        # Step 2: Verify role
        print("\nStep 2: Verifying IAM role...")
        if not self.verify_role_exists():
            return 1
        
        # Step 3: Retrieve environment variables
        print("\nStep 3: Retrieving environment variables...")
        self.retrieve_environment_variables()
        
        # Step 4: Create placeholder ZIP if needed
        print("\nStep 4: Preparing Lambda code...")
        if create_zip:
            if not self.create_placeholder_zip(zip_path):
                return 1
        elif not os.path.exists(zip_path):
            print(f"❌ ZIP file not found: {zip_path}")
            return 1
        
        # Step 5: Create Lambda functions
        print("\nStep 5: Creating Lambda functions...")
        results = self.create_all_functions(zip_path)
        
        # Step 6: Verify
        print("\nStep 6: Verifying created functions...")
        self.verify_functions()
        
        # Summary
        print(f"\n{'='*70}")
        print("SUMMARY")
        print(f"{'='*70}")
        
        successful = sum(1 for v in results.values() if v)
        total = len(results)
        
        print(f"\nSuccessfully created: {successful}/{total} Lambda functions")
        
        if successful < total:
            print("\nFailed functions:")
            for name, success in results.items():
                if not success:
                    print(f"  • {name}")
        
        print(f"\n{'='*70}")
        print("NEXT STEPS")
        print(f"{'='*70}")
        print("""
1. Upload actual Lambda function code to AWS:
   - Replace the placeholder ZIP with your actual code
   - Update each function using AWS console or CLI

2. Configure triggers:
   - API Gateway for HTTP endpoints
   - S3 for file processing
   - DynamoDB Streams for table events
   - WebSocket API for real-time connections

3. Test the functions:
   - Use AWS Lambda console or AWS CLI to test
   - Check CloudWatch logs for debugging

4. Monitor and log:
   - Enable CloudWatch logs
   - Set up alarms for errors and duration
        """)
        
        return 0 if successful == total else 1

def main():
    parser = argparse.ArgumentParser(description='Create AWS Lambda functions for TranscribeProj001')
    parser.add_argument('--region', default='us-east-1', help='AWS region (default: us-east-1)')
    parser.add_argument('--zip-path', default='lambda-code.zip', help='Path to Lambda code ZIP file')
    parser.add_argument('--no-create-zip', action='store_true', help='Skip creating placeholder ZIP')
    
    args = parser.parse_args()
    
    creator = LambdaFunctionCreator(region=args.region)
    exit_code = creator.run(
        zip_path=args.zip_path,
        create_zip=not args.no_create_zip
    )
    
    sys.exit(exit_code)

if __name__ == '__main__':
    main()

# app/storage.py
import os
import boto3
from botocore.exceptions import ClientError
from typing import Optional
from app.settings import settings

S3_BUCKET = os.getenv("S3_BUCKET", settings.S3_BUCKET)
S3_REGION = os.getenv("S3_REGION", settings.S3_REGION)

s3 = boto3.client("s3", region_name=S3_REGION)

def upload_bytes(data: bytes, key: str, content_type: str = "application/octet-stream") -> str:
    s3.put_object(Bucket=S3_BUCKET, Key=key, Body=data, ContentType=content_type)
    return f"s3://{S3_BUCKET}/{key}"

def generate_presigned_url(key: str, expires_in: int = 3600) -> Optional[str]:
    try:
        url = s3.generate_presigned_url('get_object', Params={'Bucket': S3_BUCKET, 'Key': key}, ExpiresIn=expires_in)
        return url
    except ClientError:
        return None

def upload_fileobj(fileobj, key: str, content_type: str = "application/octet-stream") -> str:
    s3.upload_fileobj(fileobj, S3_BUCKET, key, ExtraArgs={'ContentType': content_type})
    return f"s3://{S3_BUCKET}/{key}"


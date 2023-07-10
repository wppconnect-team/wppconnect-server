import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';

import { logger } from '..';
import config from '../config';

export async function bucketAlreadyExists(bucketName: string) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    const s3Client = new S3Client({ region: config.aws_s3.region });

    const command = new HeadBucketCommand({ Bucket: bucketName });

    try {
      await s3Client.send(command);
      resolve(true);
    } catch (error: any) {
      if (error.name === 'NoSuchBucket' || error.name === 'NotFound') {
        resolve(false);
      } else {
        logger.error(error);
        reject(error);
      }
    }
  });
}

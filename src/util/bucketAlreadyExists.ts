import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';

import { logger } from '..';
import config from '../config';

export async function bucketAlreadyExists(bucketName: string) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      if (!config.aws_s3.region) throw new Error('Config your AWS environment');
      const s3Client = new S3Client({ region: config.aws_s3.region });

      const command = new HeadBucketCommand({ Bucket: bucketName });
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

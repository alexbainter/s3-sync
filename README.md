# @alexbainter/s3-sync

Transfer files to and from S3.

## CLI usage

### `s3-sync deploy`

Upload files and optionally invalidate CloudFront cache.

#### Options

##### Bucket

The name of the bucket to upload to (requires read and write access).

- CLI: `--bucket <bucket name>`
- Environment variable: `S3_SYNC_BUCKET=<bucket name>`

##### Directory (optional)

The local directory containing files to upload. Defaults to `dist`.

- CLI: `--directory <path to directory>`, `--dir <path to directory>`
- Environment variable: `S3_SYNC_DIRECTORY=<path to directory>`

##### Distribution ID (optional)

The ID of a CloudFront distribution to invalidate.

- CLI: `--distributionId <distribution ID>`
- Environment variable: `S3_SYNC_DISTRIBUTION_ID=<distribution ID>`

##### Mutable filenames (optional)

A list of filenames whose content may change. Defaults to `index.html sw.js`.

- CLI: `--mutableFilenames <list of filenames>`, `--mutables <list of filenames>`
- Environment variable: `S3_SYNC_MUTABLE_FILENAMES=<list of filenames>`

##### Compress Extensions (optional)

A list of file extensions which should be compressed before upload. Defaults to `css js html png json xml webapp ico`.

- CLI: `--compressExtensions <list of extensions>, --compress <list of extensions>`
- Environment variable: `S3_SYNC_COMPRESS_EXTENSIONS=<list of extensions>`

##### Dry Run (optional)

Run command without uploading any files or invalidating a cache.

- CLI: `--dryRun`,
- Environment variable: `S3_SYNC_DRY_RUN=<true/false>`

##### Page Names (optional)

A list of HTML files. Useful for vanity URLs like "example.com/my-page" instead of "example.com/my-page.html"

- CLI: `--pageNames <list of page names>`,
- Environment variable: `S3_SYNC_PAGE_NAMES=<list of page names>`

### `s3-sync pull`

Download remote files to local file system.

#### Options

##### Bucket

The name of the bucket to download from (requires read access).

- CLI: `--bucket <bucket name>`
- Environment variable: `S3_SYNC_BUCKET=<bucket name>`

##### Directory (optional)

The local directory to download files to. Defaults to `dist`.

- CLI: `--directory <path to directory>`, `--dir <path to directory>`
- Environment variable: `S3_SYNC_DIRECTORY=<path to directory>`

##### Mutable filenames (optional)

A list of filenames whose content may change. Defaults to `index.html sw.js`.

- CLI: `--mutableFilenames <list of filenames>`, `--mutables <list of filenames>`
- Environment variable: `S3_SYNC_MUTABLE_FILENAMES=<list of filenames>`

##### Dry Run (optional)

Run command without downloading any files.

- CLI: `--dryRun`,
- Environment variable: `S3_SYNC_DRY_RUN=<true/false>`

## AWS authentication

See [Setting Credentials is Node.js](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html) from AWS for all authentication options.

### Environment variables

- `AWS_ACCESS_KEY_ID=<access key id>`
- `AWS_SECRET_ACCESS_KEY=<secret access key>`

See [Loading Credentials in Node.js from Environment Variables
](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-environment.html) from AWS for more information.

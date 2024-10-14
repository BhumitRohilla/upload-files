# file-upload

This project is a file upload service built with Next.js, Tailwind CSS, ShadCN UI, TypeScript, MongoDB, Redis, AWS S3, and AWS SNS. The application enables users to upload files securely and manage them, leveraging AWS services for storage and notifications.

## Features

- **Next.js**: Fast, server-rendered React framework for seamless client-side experience.
- **Tailwind CSS & ShadCN UI**: Styling with utility-first CSS framework and ShadCN UI for customizable components.
- **TypeScript**: Provides type safety and better developer experience.
- **MongoDB**: Database to store file metadata and user information.
- **Redis**: For caching.
- **AWS S3**: Storage solution for securely storing uploaded files.
- **AWS SNS**: Notifications service to send alerts for file uploads.

## Prerequisites

- Node.js
- MongoDB
- Redis
- AWS Account with S3 and SNS access

## Getting Started

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-username/file-upload.git
   cd file-upload
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   AWS_KEY=
   AWS_SECRETE=
   BUCKET_NAME=
   AWS_ENDPOINT=
   AWS_REGION=
   SQS_QUEUE=
   MONGODB_URL=
   REDIS_HOST=
   REDIS_PORT=
   ```

4. **Run the development server:**
   ```bash
   pnpm run dev
   ```
   Visit http://localhost:3000 to view the application.

## Scripts
* ```pnpm run dev```: Runs the app in development mode with hot-reloading enabled.
* ```pnpm run build```: Builds the application for production.
* ```pnpm run start```: Starts the production server.
* ```pnpm run lint```: Lints the code for any issues.

## Deployment
   To deploy this application, consider using services like Vercel, AWS Elastic Beanstalk, or similar. Ensure your environment variables are set correctly in the deployment environment.

## License

   This project is licensed under the MIT License.

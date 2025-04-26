# Neo-Tube-Chat

## Docker Deployment on EC2 Ubuntu

### Prerequisites

- Docker installed on your EC2 instance
- Docker Compose installed on your EC2 instance

### Setup

1. Clone the repository on your EC2 instance:

   ```bash
   git clone <your-repository-url>
   cd neo-tube-chat
   ```

2. Create a `.env` file with your environment variables:

   ```bash
   touch .env
   # Add your environment variables to the .env file
   ```

3. Build and start the Docker container:
   ```bash
   docker-compose up -d
   ```

This will build the Docker image and start the container in detached mode.

### Stopping the application

To stop the Docker container:

```bash
docker-compose down
```

### Viewing logs

To view application logs:

```bash
docker-compose logs -f
```

### Rebuilding after changes

If you make changes to the application:

```bash
docker-compose up -d --build
```

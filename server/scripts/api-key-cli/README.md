# API Key Management CLI

A simple CLI tool for managing API keys for the Attendance Application. These keys will be used by the hardware devices to authenticate with the server.

## Features

- Generate API keys with a name.
- List all API keys.
- Revoke an API key.
- Check the status of an API key.
- Installation

1. Install Dependencies

```bash
npm install
```

1. Set Up the Database. Ensure the database.db file exists at ../../data/database.db. The schema will be created automatically on the first run.

## Usage

1. Generate an API Key

```bash
   ./cli.js generate <name>
```

**Example:**

```
./cli.js generate my-service
```

**Output:**

```bash
API Key Generated:
Name: my-service
Key: 53f5e8134e8ec52ac934a119c30650d1cfaf400389334bd3fd2db55f08fbed42
Created At: 2025-03-14T02:22:16.848Z
Expires At: 2025-06-12T02:22:16.849Z
```

2. List API Keys

```bash
./cli.js list
```

**Output:**

```
API Keys:
1 | my-service | 53f5e8... | Created: 2025-03-14T02:22:16.848Z | Expires: 2025-06-12T02:22:16.849Z | Active
```

3. Revoke an API Key

```bash
./cli.js revoke <apiKey>
```

**Example:**

```bash
./cli.js revoke 53f5e8134e8ec52ac934a119c30650d1cfaf400389334bd3fd2db55f08fbed42
```

**Output:**

```bash
API Key revoked
```

4. Check API Key Status

```bash
./cli.js status <apiKey>
```

**Example:**

```bash
./cli.js status 53f5e8134e8ec52ac934a119c30650d1cfaf400389334bd3fd2db55f08fbed42
```

**Output:**

```bash
API Key Status: Active
Name: my-service
Created: 2025-03-14T02:22:16.848Z
Expires: 2025-06-12T02:22:16.849Z
```

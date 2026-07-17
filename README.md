# ServiceFlow

ServiceFlow is a multi-tenant field-service management platform for small and mid-sized maintenance companies.

It will help office staff manage customers, service locations, work orders, and technician assignments, while technicians can track and complete their assigned jobs.

## Planned features

- Email/password authentication with email confirmation and password reset
- Google and Microsoft sign-in
- Multi-tenant organization workspaces
- Role-based access for owners, dispatchers, technicians, and managers
- Customer and service-location management
- Work-order creation, assignment, scheduling, and status tracking
- Technician job updates, notes, and attachments
- Operational dashboard and reporting

## Tech stack

- ASP.NET Core Web API
- React with TypeScript
- SQL Server
- Entity Framework Core
- ASP.NET Core Identity
- Docker Compose

## Project status

Local SQL Server development infrastructure and ASP.NET Core Identity persistence are complete.

Authentication endpoints and organization onboarding are next.

## Local development setup

### Prerequisites

- .NET 8 SDK
- Node.js and npm
- Docker Desktop

### 1. Configure and start SQL Server

Create your local environment file from the included example:

```powershell
Copy-Item .env.example .env
```

Open `.env` and replace the example password with a strong local SQL Server password.

Start SQL Server:

```powershell
docker compose up -d
docker compose ps
```

The SQL Server container is exposed locally at:

```text
Server: localhost,14333
Username: sa
Password: The value of MSSQL_SA_PASSWORD in your .env file
```

You can also connect to this instance through SSMS using those details.

### 2. Configure the API connection string

This step is required once per local machine. Replace `YOUR_PASSWORD` with the value from your `.env` file:

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost,14333;Database=ServiceFlow;User Id=sa;Password=YOUR_PASSWORD;Encrypt=False;TrustServerCertificate=True" --project .\ServiceFlow.Api
```

The connection string is stored in .NET User Secrets and is not committed to Git.

### 3. Create or update the local database

This step is needed only when setting up a fresh local database:

```powershell
dotnet tool restore

dotnet tool run dotnet-ef database update --project .\ServiceFlow.Api --startup-project .\ServiceFlow.Api
```

### 4. Run the API

```powershell
dotnet run --project .\ServiceFlow.Api
```

Swagger is available at the HTTPS address printed by the API, followed by `/swagger`.

### Health check

While the API and SQL Server container are running, open the API HTTPS address printed in the console followed by `/health`.

For example:

```text
https://localhost:PORT/health

## Repository structure

```text
ServiceFlow/
├─ ServiceFlow.Api/       ASP.NET Core Web API
├─ ServiceFlow.Web/       React + TypeScript application
├─ compose.yaml           Local SQL Server container configuration
└─ ServiceFlow.sln
```

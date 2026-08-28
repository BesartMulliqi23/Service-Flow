# ServiceFlow

ServiceFlow is a multi-tenant field-service management platform for small and mid-sized maintenance companies.

It helps office staff manage customers, service locations, work orders, technician assignments, and operational workflows. Technicians can view and complete their assigned jobs in the field.

## Implemented

### Authentication

- Email/password registration
- Email confirmation
- Login and logout with secure HTTP-only cookies
- Current-user endpoint
- Account lockout after repeated failed sign-in attempts
- Forgot-password and password-reset flows
- Google sign-in
- Microsoft sign-in

### Organization onboarding

- Multi-tenant organization workspaces
- First-time organization creation during local account registration
- First-time organization creation after Google or Microsoft sign-in
- Owner role assignment for organization creators
- Seeded roles: Owner, Manager, Dispatcher, and Technician

### Organization invitations

- Invitation creation for organization owners
- Secure random invitation tokens
- Invitation email delivery through SMTP
- Invitation expiration and acceptance validation
- Local/password-based invitation acceptance
- Google invitation acceptance
- Microsoft invitation acceptance
- Invited-role assignment during account creation
- Duplicate invitation replacement for the same organization and email address

### Development infrastructure

- SQL Server in Docker Compose
- Mailpit for local email testing
- Entity Framework Core migrations
- Database health endpoint at `/health`
- Swagger/OpenAPI in Development

## In progress

### Tenant isolation and authorization
 
- Organization-scoped data access through the current authenticated organization
- Role-based policies for Owners, Managers, Dispatchers, and Technicians
- Tenant-aware database relationships for Customers, Service Locations, Work Orders, and Work Order Assignments

### Core dispatch workflow

- Customer creation, updates, deactivation, and tenant-scoped retrieval
- Service Location creation, updates, deactivation, filtering, and tenant-scoped retrieval
- Work Order creation, Draft-only updates, retrieval, and filtering
- Work Order scheduling and rescheduling with UTC time validation
- Tenant-scoped Technician directory for dispatchers
- Multi-technician Work Order assignments
- Assignment listing and removal for Scheduled Work Orders
- Technician-only access to assigned Work Orders and job-site details
- Technician start and completion workflow
- Status-change history with acting Technician, timestamp, and completion note

## Roadmap

- Calendar views and scheduling-conflict detection
- Materials, photos, attachments, and general Technician notes
- Dashboard and operational reporting
- Notifications and reminders
- Audit logging
- Search, filtering, and pagination
- Automated authorization and business-rule tests
- Demo data, deployment, CI, screenshots, and demo video

## Tech stack

- ASP.NET Core Web API
- React with TypeScript
- SQL Server
- Entity Framework Core
- ASP.NET Core Identity
- Google and Microsoft OAuth
- Docker Compose
- Mailpit
- MailKit

## Local development setup

### Prerequisites

- .NET 8 SDK
- Node.js and npm
- Docker Desktop

### 1. Configure local services

Create your local environment file:

```powershell
Copy-Item .env.example .env
```

Open `.env` and replace the example password with a strong local SQL Server password.

Start SQL Server and Mailpit:

```powershell
docker compose up -d
docker compose ps
```

SQL Server is exposed locally at:

```text
Server: localhost,14333
Username: sa
Password: The value of MSSQL_SA_PASSWORD in .env
```

Mailpit captures development email locally:

```text
http://localhost:8025
```

### 2. Configure API secrets

Set the local SQL Server connection string once per machine. Replace `YOUR_PASSWORD` with the password in `.env`.

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost,14333;Database=ServiceFlow;User Id=sa;Password=YOUR_PASSWORD;Encrypt=False;TrustServerCertificate=True" --project .\ServiceFlow.Api
```

The connection string is stored in .NET User Secrets and is not committed to Git.

To test Google or Microsoft sign-in, configure their client credentials in User Secrets:

```powershell
dotnet user-secrets set "Authentication:Google:ClientId" "YOUR_GOOGLE_CLIENT_ID" --project .\ServiceFlow.Api
dotnet user-secrets set "Authentication:Google:ClientSecret" "YOUR_GOOGLE_CLIENT_SECRET" --project .\ServiceFlow.Api

dotnet user-secrets set "Authentication:Microsoft:ClientId" "YOUR_MICROSOFT_CLIENT_ID" --project .\ServiceFlow.Api
dotnet user-secrets set "Authentication:Microsoft:ClientSecret" "YOUR_MICROSOFT_CLIENT_SECRET" --project .\ServiceFlow.Api
```

### 3. Create or update the local database

This is needed when setting up a fresh local database:

```powershell
dotnet tool restore

dotnet tool run dotnet-ef database update --project .\ServiceFlow.Api --startup-project .\ServiceFlow.Api
```

### 4. Run the API

```powershell
dotnet run --project .\ServiceFlow.Api
```

Swagger is available at the HTTPS address printed by the API, followed by `/swagger`.

The database health endpoint is available at:

```text
https://localhost:PORT/health
```

### 5. Run the frontend

```powershell
cd .\ServiceFlow.Web
npm install
npm run dev
```

## Repository structure

```text
ServiceFlow/
├─ ServiceFlow.Api/       ASP.NET Core Web API
├─ ServiceFlow.Web/       React + TypeScript application
├─ compose.yaml           Local SQL Server and Mailpit configuration
└─ ServiceFlow.sln
```
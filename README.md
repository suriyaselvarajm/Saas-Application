Petrus SaaS Platform: Comprehensive Walkthrough
This document provides a complete overview of the Petrus SaaS platform's development, architecture, and current state. It covers the evolution from a legacy tool to a modern, multi-tenant enterprise application.

1. Project Vision & Architecture
The goal is to provide a unified Identity & Access Management (IAM) Portal for multi-tenant SaaS environments, specifically targeting hybrid M365 and Active Directory setups.

Core Stack
Frontend: Next.js (App Router) using Tailwind CSS v4 for a high-performance, modern UI.
Backend: NestJS providing a scalable, structured API.
Database: PostgreSQL managed via Prisma ORM.
Theming: Integrated Light/Dark mode support using next-themes.
2. Foundational Concepts
Multi-Tenancy
The application uses a Shared Database, Shared Schema approach. Every record (User, Office, Department, etc.) is linked to a tenantId. Isolation is enforced at the API layer using the @TenantId() decorator.

Authentication & RBAC
Mock Auth: For local development, we use a mock JWT flow. A token like Bearer mock-jwt-token-for-<userId> allows developers to bypass complex O365/Azure AD setup.
Roles: System-wide RBAC defines roles like SUPER_ADMIN, TENANT_ADMIN, HR_ADMIN, and IT_ADMIN.
Master Tenant: The system automatically seeds a "Master Tenant" (petrus.io) on the first login of admin@petrus.io.
3. Development Journey
Phase 1: Environment & Setup
We began by migrating the legacy Python logic into a modern web stack.

Backend Port: 3001
Frontend Port: 3000
Database: Port 5433 (PostgreSQL)
Resolved: Initial startup conflicts and database connectivity issues.
Phase 2: Core Authentication
Integrated the login page with the backend.
Implemented the auto-provisioning logic that creates the initial admin user and tenant if they don't exist.
Phase 3: Theming & Visual Excellence
The UI was overhauled to provide a premium feel:

Glassmorphism: Implementation of the .glass-card utility for a modern, frosted-glass effect.
Theme Switching: Refactored hardcoded styles into semantic classes (text-slate-900 dark:text-white) to support Light and Dark modes seamlessly.
Phase 4: Settings & Organization CRUD (Current)
We transitioned from static placeholders to a fully functional management system for:

Office Locations: Manage global HQ and regional offices.
Departments: Organize the workforce into functional units.
Integration: Added backend DTOs, Controllers, and Services to handle database persistence.
4. Key Modules Overview
🌍 Tenant Management
Allows SUPER_ADMIN to manage different customer tenants, their domains, and subscription statuses.

⚙️ Organization Settings
Offices: CRUD functionality for physical locations.
Departments: CRUD functionality for team structures.
M365/AD Settings: Configuration for external identity provider synchronization (Future Phase).
5. How to Run & Verify
Startup Commands
Backend: npm run start:dev (in /backend)
Frontend: npm run dev (in /frontend)
Verification Flow
Login: Use admin@petrus.io to gain Super Admin access.
Settings: Navigate to Office Locations or Departments.
CRUD: Add a new entry, edit it, and verify it persists after a page refresh.
Theme: Toggle the theme in the dashboard and verify the .glass-card and text remain readable.

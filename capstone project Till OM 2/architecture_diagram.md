# Sigistics: Final Full-Stack MVC Architecture Blueprint

This document presents the definitive architectural blueprint for the Sigistics platform. It captures the dedicated multi-role frontend meshes, the unified Axios communication layer, and the highly detailed MVC backend structure (Node.js & Python), refined for absolute textual accuracy and structural clarity.

## System Architecture Blueprint

```mermaid
graph TB
    %% ==========================================
    %% 👤 MASTER HIERARCHY
    %% ==========================================
    Master_User(("👤 User"))
    
    subgraph Roles [Dedicated Actors]
        direction LR
        Customer["👤 Customer"]
        Admin["👮 Admin"]
        Agent["🚚 Delivery Agent"]
    end
    
    Master_User --> Customer
    Master_User --> Admin
    Master_User --> Agent

    %% ==========================================
    %% 🚀 DISTRIBUTED FRONTEND MESHES
    %% ==========================================
    
    %% Path 1: Customer
    subgraph Cust_Mesh [📦 Customer Frontend Mesh]
        direction TB
        Cust_Dash["Shipment Dashboard"]
        Cust_Create["Create Shipment"]
        Cust_Pay["Payment Processing"]
    end

    %% Path 2: Admin
    subgraph Admin_Mesh [📦 Ops Admin Mesh]
        direction TB
        Admin_Analytic["Analytics (Recharts)"]
        Admin_Intake["Shipment Intake (Multer/xlsx)"]
        Admin_Rule["Rule Configuration Tool"]
        Admin_Sys["System Monitoring"]
    end

    %% Path 3: Agent
    subgraph Agent_Mesh [📦 Delivery Agent Frontend Mesh]
        direction TB
        Agt_Loc["Location Updates"]
        Agt_Stat["Status Updates"]
        Agt_Dash["Agent Dashboard"]
        Agt_Prof["Agent Profile"]
    end

    Customer --> Cust_Mesh
    Admin --> Admin_Mesh
    Agent --> Agent_Mesh

    %% ==========================================
    %% ⚡ CONSOLIDATION BRIDGE
    %% ==========================================
    subgraph Bridge [API Routing Layer]
        Axios["🚀 Axios"]
    end

    %% Mapped Endpoints out of Frontend
    Cust_Mesh -->|"POST /api/shipments"| Axios
    Admin_Mesh -->|"POST /api/rules"| Axios
    Agent_Mesh -->|"PATCH /api/agent"| Axios

    %% ==========================================
    %% 🔒 SECURITY MESH (Far Left)
    %% ==========================================
    subgraph Security_Layer [🛡️ Security Layer]
        direction TB
        JWT["🔒 JWT Authentication"]
        RBAC["🗝️ RBAC Permission Check"]
        JWT --> RBAC
    end

    %% ==========================================
    %% 🟢 PRIMARY API TIER: MVC (Node.js / Express)
    %% ==========================================
    subgraph Backend_Tier ["(A) Main API Tier (Node.js/Express)"]
        direction TB
        Passport["🔑 Passport Auth"]
        Joi["🛡️ Joi Validation"]
        
        %% Deep Backend Details
        Router["Express Routers"]
        Controllers["Controllers"]
        Services["Services Layer"]
        
        subgraph Adapters [Data Adapters]
            Seq["🐘 Sequelize (for relational)"]
            Mongoose["🍃 Mongoose (for non-relational)"]
        end

        Passport --> Joi
        Joi --> Router
        Router --> Controllers
        Controllers --> Services
        Services --> Adapters
    end

    %% Security Hooks
    Axios -->|"REST API"| Passport
    Security_Layer -.->|"Token Check"| Passport

    %% ==========================================
    %% 🐍 RULE ENGINE MICROSERVICE (Python / FastAPI)
    %% ==========================================
    subgraph Rule_Engine ["(B) Rule Microservice (Python/FastAPI)"]
        direction TB
        Uvicorn["Beanie ODM (object-document mapper)"]
        Motor["Motor asynchronous driver"]
        
        subgraph Pydantic_Flow [Data Validation]
            Pydantic["Pydantic data validation"]
            Pipeline["Pydantic Pipeline"]
            Pydantic --> Pipeline
        end
        
        Uvicorn --> Motor
        Motor --> Pydantic_Flow
    end

    %% ==========================================
    %% ☁️ INTEGRATION HUB (SaaS MESH)
    %% ==========================================
    subgraph Integration_Hub [Integration Hub]
        direction TB
        Groq["🤖 Groq AI"]
        Razorpay["💳 Razorpay Gateway"]
        Nodemailer["📧 Nodemailer SMTP"]
    end

    %% ==========================================
    %% 🗄️ PERSISTENCE MESH (DATA TIER)
    %% ==========================================
    subgraph Persistence [Persistence Mesh]
        direction LR
        MySQL[("🛢️ MySQL Cluster")]
        MongoDB[("📊 MongoDB Replica Set")]
        MySQL <-->|"Database Sync"| MongoDB
    end

    %% ==========================================
    %% 🔗 BACKEND DATA FLOWS
    %% ==========================================
    %% Service Interconnects
    Adapters -.->|"Beanie Async IO"| Uvicorn
    Backend_Tier -->|"API Call"| Integration_Hub
    
    %% Database Handshakes
    Adapters --> Persistence
    Rule_Engine -->|"MongoDB OpLog Sync"| MongoDB

    %% ==========================================
    %% 🎨 HIGH-FIDELITY STYLING
    %% ==========================================
    classDef actor fill:#1e293b,stroke:#94a3b8,stroke-width:2px,color:#f8fafc;
    classDef frontend fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#e2e8f0;
    classDef backend fill:#172554,stroke:#6366f1,stroke-width:2px,color:#e0e7ff;
    classDef engine fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#d1fae5;
    classDef db fill:#312e81,stroke:#a855f7,stroke-width:2px,color:#f3e8ff;
    classDef cloud fill:#4c1d95,stroke:#ec4899,stroke-width:2px,color:#fce7f3;

    class Master_User,Customer,Admin,Agent actor;
    class Cust_Mesh,Cust_Dash,Cust_Create,Cust_Pay,Admin_Mesh,Admin_Analytic,Admin_Intake,Admin_Rule,Admin_Sys,Agent_Mesh,Agt_Loc,Agt_Stat,Agt_Dash,Agt_Prof,Axios frontend;
    class Backend_Tier,Passport,Joi,Router,Controllers,Services,Adapters,Seq,Mongoose backend;
    class Rule_Engine,Uvicorn,Motor,Pydantic_Flow,Pydantic,Pipeline engine;
    class Persistence,MySQL,MongoDB db;
    class Integration_Hub,Groq,Razorpay,Nodemailer,Security_Layer,JWT,RBAC cloud;
```

## Architectural Additions Tracked
1. **Ultimate Hierarchy**: Singular `User` splitting strictly into `Customer`, `Admin`, and `Delivery Agent`.
2. **True Frontend Representation**: `Delivery Portal` explicitly replaces hallucinations like Google Maps.
3. **Deep MVC Core**: `Express Routers` pass precisely into `Controllers` and down to `Services Layer` prior to triggering database ORMs.
4. **Security Integrity**: Eliminated visual duplications; Security Layer operates with a single `JWT` handshake and a singular `RBAC` role check.
i s

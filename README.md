# InternMatch – AI-Powered Internship Recommendation and Matching System

## 1. Project Overview

InternMatch is a web-based platform that helps students discover and apply for suitable internship opportunities.

It combines skill-based matching and AI-powered semantic recommendations to connect students with relevant internships based on their skills, profiles, and career goals.

The platform also provides an administrator module to manage internship listings, students, and applications.

## 2. Key Features

### Student Module
- Secure student login and logout.
- Browse available internships.
- View skill-based internship matches.
- Receive AI-powered internship recommendations.
- Identify missing skills.
- Save and remove internships.
- Apply for internships.
- Track application status.
- View and update profile information.

### Admin Module
- Secure administrator login and logout.
- Add, view, update, and delete internships.
- View registered student records.
- View internship applications.
- Update application statuses.

### AI Recommendation Module
- Semantic comparison of student profiles and internship descriptions.
- Sentence Transformers for generating text embeddings.
- ChromaDB for vector-based similarity search.
- Ranked internship recommendations.

## 3. Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes |
| AI Backend | Python, FastAPI |
| Relational Database | PostgreSQL |
| Database Connectivity | Node.js pg |
| Vector Database | ChromaDB |
| Embedding Model | Sentence Transformers |

## 4. Database Design

The primary relational database consists of nine tables:

1. `users`
2. `student_profiles`
3. `skills`
4. `student_skills`
5. `internships`
6. `internship_skills`
7. `applications`
8. `saved_internships`
9. `projects`

The database implements:
- Primary keys and foreign keys.
- Unique and CHECK constraints.
- Indexing.
- SQL joins and aggregate functions.
- Database views.
- User-defined functions.
- Triggers.
- Transactions.

The database schema is available in `internmatch_schema.sql`.

## 5. API Endpoints

### Student and General APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/internships` | Retrieve open internships |
| POST | `/api/student/login` | Student login |
| POST | `/api/student/logout` | Student logout |
| GET | `/api/student/me` | Retrieve student profile |
| PUT | `/api/student/me` | Update student profile |
| GET | `/api/students/[id]/matches` | Skill-based matching |
| GET | `/api/students/[id]/recommendations` | AI recommendations |
| GET | `/api/students/[id]/applications` | View applications |
| POST | `/api/students/[id]/applications` | Apply for an internship |
| GET | `/api/students/[id]/saved-internships` | View saved internships |
| POST | `/api/students/[id]/saved-internships` | Save an internship |
| DELETE | `/api/students/[id]/saved-internships` | Remove a saved internship |

### Admin APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/admin/login` | Admin login |
| POST | `/api/admin/logout` | Admin logout |
| GET | `/api/admin/applications` | View all applications |
| PATCH | `/api/admin/applications/[id]` | Update application status |
| GET | `/api/admin/internships` | View internships |
| POST | `/api/admin/internships` | Add internship |
| PUT | `/api/admin/internships/[id]` | Update internship |
| DELETE | `/api/admin/internships/[id]` | Delete internship |
| GET | `/api/admin/students` | View student records |

## 6. AI Service Endpoints

The semantic recommendation service is developed using FastAPI.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Service information |
| POST | `/sync-internships` | Synchronize internship data |
| GET | `/recommend/{student_id}` | Generate recommendations |
| POST | `/semantic-match` | Perform semantic matching |
| POST | `/search-stored-internships` | Search stored internships |

Interactive API documentation is available at:

`http://127.0.0.1:8001/docs`

## 7. Project Setup

### Prerequisites

- Node.js and npm
- Python 3
- PostgreSQL
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/gaganaraj/InternMatch.git
cd InternMatch
```

### Step 2: Install Dependencies

```bash
npm install
```

Create and activate the Python virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install the Python dependencies required by the semantic API, including FastAPI, Uvicorn, Sentence Transformers, and ChromaDB.

### Step 3: Configure PostgreSQL

Create a PostgreSQL database and execute:

```text
internmatch_schema.sql
```

### Step 4: Configure Environment Variables

Create a `.env.local` file in the project root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=YOUR_DATABASE_NAME
DB_USER=YOUR_DATABASE_USER
DB_PASSWORD=YOUR_DATABASE_PASSWORD

ADMIN_SESSION_SECRET=YOUR_SECURE_SECRET
SEMANTIC_API_URL=http://127.0.0.1:8001
```

Use your own database credentials and a securely generated session secret.

**Never upload `.env.local` or expose passwords and secret keys on GitHub.**

### Step 5: Start the AI Service

```powershell
uvicorn semantic_api:app --reload --port 8001
```

FastAPI documentation:

`http://127.0.0.1:8001/docs`

### Step 6: Start the Web Application

Open another terminal:

```bash
npm run dev
```

Open the application:

`http://localhost:3000`

## 8. Testing

The project contains the following testing and database inspection scripts:

- `test_postgres.py`
- `test_skill_matching.py`
- `test_application_transaction.py`
- `review_database.py`
- `inspect_matching_data.py`

To check TypeScript:

```bash
npx tsc --noEmit
```

To create a production build:

```bash
npm run build
```

## 9. Security and Validation

- Separate student and administrator authentication.
- Password hash verification.
- Session-based access control.
- Student ownership verification.
- Input validation.
- Database constraints for data integrity.
- Duplicate application prevention.

## 10. Future Enhancements

- Resume parsing and automated skill extraction.
- Explainable internship recommendations.
- Email notifications.
- Advanced administrator analytics.
- External internship platform integration.

## 11. Conclusion

InternMatch integrates web development, relational database management, and artificial intelligence to simplify internship discovery.

The platform provides students with relevant internship opportunities while enabling administrators to manage internship listings and applications efficiently.

---

**GitHub Repository:**  
https://github.com/gaganaraj/InternMatch


# InternMatch – AI-Powered Internship Recommendation and Matching System

InternMatch is a web-based platform designed to help students discover, compare, save, and apply for relevant internship opportunities. It combines relational database management, skill-based matching, and AI-powered semantic recommendations to connect students with internships that align with their profiles and career interests.

The system also provides an administrator module for managing internship listings, viewing student records, and tracking applications.

**GitHub Repository:** [https://github.com/gaganaraj/InternMatch](https://github.com/gaganaraj/InternMatch)

---

## 1. Team Members and Roles

| Team Member | USN | Role |
|---|---|---|
| **Gaganashree R** | PES2UG24AM058 | Database Design, Backend Development & AI Integration |
| **Jyothika M** | PES2UG24AM070 | Frontend Development & Documentation |

---

## 2. Project Objectives

- Provide students with a single platform to explore internship opportunities.
- Match student skills with the skills required by internships.
- Generate AI-powered recommendations using semantic similarity.
- Allow students to save internships, apply, and track application progress.
- Help administrators manage internships, students, and applications.
- Maintain data consistency and integrity through relational database constraints and database-level operations.

---

## 3. Key Features

### Student Module

- Secure student login and logout.
- View and update student profile information.
- Browse available internships.
- View skill-based internship matches and matching percentages.
- Receive AI-powered semantic recommendations.
- Identify skills matched to internship requirements.
- Save and remove internships from the saved list.
- Apply for internships.
- View submitted applications and track their status.

### Administrator Module

- Secure administrator login and logout.
- Add, view, update, and delete internship listings.
- View registered student records.
- View applications submitted by students.
- Update application statuses.
- Monitor internship and application information through the dashboard.

### AI Recommendation Module

- Compares student profile information with internship descriptions.
- Uses Sentence Transformers to generate text embeddings.
- Stores and searches vector representations using ChromaDB.
- Uses cosine similarity for semantic comparison.
- Returns ranked internship recommendations.

---

## 4. Technology Stack

| Component | Technology |
|---|---|
| Frontend Framework | Next.js 16, React 19 |
| Programming Language | TypeScript, Python |
| Styling | Tailwind CSS 4 |
| Web Backend | Next.js API Routes |
| AI Backend | FastAPI, Uvicorn |
| Relational Database | PostgreSQL |
| PostgreSQL Connectivity | Node.js `pg`, Python `psycopg2` |
| Vector Database | ChromaDB |
| Embedding Model | `sentence-transformers/all-MiniLM-L6-v2` |
| Semantic Similarity | Cosine similarity |
| Version Control | Git and GitHub |

---

## 5. System Architecture

InternMatch uses a web application layer, a relational database layer, and a separate semantic recommendation service.

1. **Frontend – Next.js and React:** Provides the student and administrator interfaces.
2. **Application APIs – Next.js API Routes:** Handle authentication, profiles, internships, saved internships, applications, and administrator operations.
3. **Relational Database – PostgreSQL:** Stores users, student profiles, skills, internships, applications, saved internships, and projects.
4. **AI Service – FastAPI:** Receives recommendation and semantic-matching requests.
5. **Vector Search – ChromaDB:** Stores and searches internship text embeddings for semantic retrieval.
6. **Embedding Model – Sentence Transformers:** Converts text into numerical vector representations that can be compared using cosine similarity.

### High-Level Data Flow

```text
Student / Administrator
          |
          v
 Next.js + React Frontend
          |
          v
   Next.js API Routes ----------------> PostgreSQL
          |
          | Recommendation request
          v
       FastAPI Service
          |
          v
 Sentence Transformers
          |
          v
       ChromaDB
          |
          v
 Ranked Semantic Recommendations
          |
          v
    Next.js Frontend
```

---

## 6. Database Design

The primary PostgreSQL database contains **nine relational tables**.

| No. | Table | Purpose |
|---:|---|---|
| 1 | `users` | Stores user account and role information. |
| 2 | `student_profiles` | Stores student profile and academic information. |
| 3 | `skills` | Maintains the list of available skills. |
| 4 | `student_skills` | Maps students to their skills. |
| 5 | `internships` | Stores internship listings and details. |
| 6 | `internship_skills` | Maps internships to their required skills. |
| 7 | `applications` | Stores student applications and their statuses. |
| 8 | `saved_internships` | Stores internships saved by students. |
| 9 | `projects` | Stores student project information. |

### Database Concepts Implemented

- Primary keys and foreign keys.
- Composite primary keys for mapping tables.
- Unique and CHECK constraints.
- One-to-many and many-to-many relationships.
- SQL joins, aggregate functions, filtering, and grouping.
- Database indexes for frequently used lookups.
- A database view for internship application statistics.
- A user-defined SQL function for skill-based matching.
- A PL/pgSQL trigger for application validation.
- Transactions using `BEGIN`, `COMMIT`, and `ROLLBACK`.

### Relationships

- A user can have a student profile.
- Students can possess multiple skills, and each skill can belong to multiple students.
- Internships can require multiple skills, and each skill can be required by multiple internships.
- Students can submit applications for internships.
- Students can save multiple internships.
- Students can maintain multiple project records.
- Users with the administrator role can post internships.

### Advanced Database Objects

| Database Object | Name | Purpose |
|---|---|---|
| View | `v_internship_application_dashboard` | Displays internship information with required-skill and application statistics. |
| SQL Function | `get_student_internship_matches(p_student_id)` | Calculates skill-match percentages and ranks internships for a student. |
| Trigger Function | `validate_internship_application()` | Checks internship availability and deadline before accepting an application insert or internship reassignment. |
| Trigger | `trg_validate_internship_application` | Executes the validation function before the relevant application operation. |

The database also uses custom indexes for application status, internship skills, internship status and deadline, projects by user, and student skills.

The schema includes validation for user roles, internship status, work mode, internship type, application status, stipend values, and other field-level rules.

**Schema file:** `internmatch_schema.sql`

---

## 7. Application Statuses

Applications use the following statuses:

- `submitted`
- `under_review`
- `shortlisted`
- `rejected`
- `accepted`
- `withdrawn`

Internship listings use the following statuses:

- `draft`
- `open`
- `closed`

The application validation trigger prevents applications from being submitted to internships that are not open or whose deadline has passed.

---

## 8. Next.js API Endpoints

### General and Student APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/internships` | Retrieves available internships. |
| POST | `/api/student/login` | Authenticates a student. |
| POST | `/api/student/logout` | Logs out a student. |
| GET | `/api/student/me` | Retrieves the authenticated student's profile. |
| PUT | `/api/student/me` | Updates the authenticated student's profile. |
| GET | `/api/students/[id]/matches` | Retrieves skill-based internship matches. |
| GET | `/api/students/[id]/recommendations` | Retrieves AI-powered recommendations. |
| GET | `/api/students/[id]/applications` | Retrieves a student's applications. |
| POST | `/api/students/[id]/applications` | Submits an internship application. |
| GET | `/api/students/[id]/saved-internships` | Retrieves saved internships. |
| POST | `/api/students/[id]/saved-internships` | Saves an internship. |
| DELETE | `/api/students/[id]/saved-internships?internship_id={internshipId}` | Removes a saved internship. |
| GET | `/api/test-db` | Checks database connectivity. |

### Administrator APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/admin/login` | Authenticates an administrator. |
| POST | `/api/admin/logout` | Logs out an administrator. |
| GET | `/api/admin/applications` | Retrieves application records. |
| PATCH | `/api/admin/applications/[id]` | Updates an application's status. |
| GET | `/api/admin/internships` | Retrieves internship listings. |
| POST | `/api/admin/internships` | Creates an internship listing. |
| PUT | `/api/admin/internships/[id]` | Updates an internship listing. |
| DELETE | `/api/admin/internships/[id]` | Deletes an internship listing. |
| GET | `/api/admin/students` | Retrieves student records. |

---

## 9. FastAPI Semantic Recommendation Endpoints

The AI recommendation service is implemented separately using Python and FastAPI.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Returns service information. |
| POST | `/sync-internships` | Synchronizes internship data for semantic search. |
| GET | `/recommend/{student_id}` | Generates recommendations for a student. |
| POST | `/semantic-match` | Performs semantic matching. |
| POST | `/search-stored-internships` | Searches internships stored in the vector database. |

Interactive API documentation is available after starting the FastAPI service:

`http://127.0.0.1:8001/docs`

---

## 10. Project Setup and Installation

### Prerequisites

Install the following tools before running the project:

- Node.js and npm.
- Python 3.
- PostgreSQL.
- Git.

### Step 1: Clone the Repository

```bash
git clone https://github.com/gaganaraj/InternMatch.git
cd InternMatch
```

### Step 2: Install Node.js Dependencies

```bash
npm install
```

### Step 3: Create and Activate a Python Virtual Environment

Run the following commands from the project root in PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install the Python dependencies:

```powershell
pip install -r requirements.txt
```

### Step 4: Create the PostgreSQL Database

Create a database named `internmatch` in PostgreSQL. For example, from a terminal with PostgreSQL command-line tools available:

```bash
createdb -U postgres internmatch
```

Alternatively, create the database using pgAdmin or the PostgreSQL command line.

### Step 5: Import the Database Schema

From the project root, run:

```bash
psql -U postgres -d internmatch -f internmatch_schema.sql
```

Change the PostgreSQL username or database name in the command when using different values.

> **Important:** `internmatch_schema.sql` contains the database structure. It does not include the project's sample users, skills, internships, or other seed records. Add suitable records before testing student matching, recommendations, and application workflows.

### Step 6: Configure Environment Variables

Create a file named `.env.local` in the project root and add your own PostgreSQL credentials and a secure administrator session secret:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=internmatch
DB_USER=postgres
DB_PASSWORD=YOUR_DATABASE_PASSWORD

ADMIN_SESSION_SECRET=YOUR_SECURE_SECRET
SEMANTIC_API_URL=http://127.0.0.1:8001
```

Replace the placeholder values with your local configuration. Do not commit `.env.local`, database passwords, or secret keys to GitHub.

### Step 7: Create the Advanced Database Objects

After configuring `.env.local` and importing the schema, run the database setup scripts from the project root:

```powershell
python create_internship_dashboard_view.py
python create_matching_function.py
python create_application_trigger.py
```

These scripts create or verify the dashboard view, the skill-matching SQL function, and the application-validation trigger.

### Step 8: Start the FastAPI Service

Open a terminal in the project root, activate the virtual environment if required, and run:

```powershell
uvicorn semantic_api:app --reload --port 8001
```

FastAPI documentation:

`http://127.0.0.1:8001/docs`

Keep this terminal running while using AI-powered recommendations.

### Step 9: Start the Next.js Application

Open a **separate terminal** in the project root and run:

```bash
npm run dev
```

Open the application in a browser:

`http://localhost:3000`

Keep both the Next.js and FastAPI services running while using the complete application.

---

## 11. Testing and Validation

The repository includes scripts for checking database connectivity, matching logic, transactions, and database structure.

| Script / Command | Purpose |
|---|---|
| `python test_postgres.py` | Tests the PostgreSQL connection. |
| `python test_skill_matching.py` | Checks skill-based matching results. |
| `python test_application_transaction.py` | Tests transaction behavior and rollback. |
| `python create_internship_dashboard_view.py` | Creates or checks the dashboard view. |
| `python create_matching_function.py` | Creates and tests the SQL matching function. |
| `python create_application_trigger.py` | Creates and tests the application-validation trigger. |
| `python review_database.py` | Inspects database objects and structure. |
| `python inspect_matching_data.py` | Inspects data used for matching. |
| `python -m pip check` | Checks for broken Python package dependencies. |
| `npx tsc --noEmit` | Runs the TypeScript type check. |
| `npm run build` | Creates a production build of the Next.js application. |

Run the Python scripts after configuring the database connection in `.env.local` and activating the Python virtual environment.

---

## 12. Security and Data Validation

- Separate authentication flows for students and administrators.
- Password hash verification.
- HTTP-only session cookies with signed session data.
- Session-based access control for protected routes.
- Student ownership checks to prevent access to another student's records.
- Administrator authorization for protected management operations.
- Input validation in application APIs.
- Database constraints to preserve data integrity.
- Prevention of duplicate student applications for the same internship.
- Trigger-based validation of internship status and application deadlines.

---

## 13. Entity Relationship Diagram

The Chen ER diagram represents the nine entities, their attributes, keys, and relationships in the InternMatch database.

[View InternMatch Chen ER Diagram](docs/InternMatch_ER_Diagram.pdf)

---

## 14. Future Enhancements

- Resume parsing and automated skill extraction.
- More detailed explanations for AI-generated recommendations.
- Email notifications for application status updates.
- Additional administrator analytics and reporting.
- Integration with external internship listing platforms.

---

## 15. Conclusion

InternMatch combines full-stack web development, relational database management, and artificial intelligence to simplify internship discovery and application tracking. The platform provides students with skill-based and semantic internship recommendations while enabling administrators to manage internship listings and applications through a centralized system.

---

**Repository:** [gaganaraj/InternMatch](https://github.com/gaganaraj/InternMatch)

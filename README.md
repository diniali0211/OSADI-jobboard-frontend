# OSADI Job Board — Recruiter Frontend

Recruiter-facing dashboard for `OSADI-jobboard-backend`. Lets recruiters create
job postings, upload resumes against them (forwarded to the main ATS for
parsing), and confirm hires through the PIN-protected flow.

## One required backend change

The login screen needs a way to verify the shared app password. Add this to
`OSADI-jobboard-backend/main.py`:

```python
class AuthVerify(BaseModel):
    password: str

@app.post("/auth/verify")
async def verify_app_password(payload: AuthVerify, db: AsyncSession = Depends(get_db)):
    """Checks a password against the same app_password used by the main ATS.
    Used only to gate the job board frontend's login screen — read-only,
    no side effects."""
    result = await db.execute(select(Settings).where(Settings.id == 1))
    settings = result.scalars().first()
    correct_password = settings.app_password if settings else "admin123"

    if payload.password != correct_password:
        raise HTTPException(status_code=401, detail="Incorrect password")

    return {"status": "ok"}
```

Commit and push — Railway redeploys automatically. Everything else in this
frontend already matches the deployed backend's endpoints as-is.

## Setup

```bash
npm install
cp .env.example .env   # then set VITE_JOBBOARD_API_URL to your Railway URL
npm run dev
```

## Build

```bash
npm run build    # outputs to dist/
```

Deploy `dist/` to Vercel as a static site, or connect the repo directly to
Vercel and set `VITE_JOBBOARD_API_URL` as an environment variable there.

## How auth works

There's no user accounts system — recruiters share the same app password as
the main ATS (`Settings.app_password`). On login, the password is checked
against `/auth/verify` and, if correct, kept in memory + a `sessionStorage`
flag (not the password itself) for the rest of the tab session. The PIN
setup screen re-prompts for the admin password before setting or resetting
any recruiter's PIN, per the fraud-prevention design.

## Structure

```
src/
  types/index.ts          — shared types matching backend response shapes
  services/jobBoardApi.ts — API client, one function per backend endpoint
  context/AuthContext.tsx — in-memory password gate
  components/
    Login.tsx              — password gate screen
    Sidebar.tsx             — nav between Job Postings / Recruiter PINs
    JobPostings.tsx         — main table: stats, create/edit/delete jobs
    JobFormModal.tsx        — create/edit job posting form
    JobDetailModal.tsx      — candidates linked to a job, resume upload
    HireConfirmModal.tsx    — PIN-protected hire confirmation
    RejectModal.tsx         — reject reason picker
    RecruiterPins.tsx       — admin sets up/resets each recruiter's PIN
```

## Notes on the backend contract

- `POST /jobs/{id}/candidates` forwards the file to the main ATS's
  `/analyze` endpoint, so uploads will fail with a 502 if that service is
  down — the upload UI surfaces this directly rather than retrying silently.
- `POST /decision` requires `recruiter` + `pin` only when `decision` is
  `HIRED`; the backend returns specific error messages for "no PIN set up"
  vs "incorrect PIN" — the frontend just displays whatever message comes
  back rather than re-interpreting it.
- Recruiters and reject reasons are hardcoded lists (`src/types/index.ts`)
  matching the handoff doc. If either list changes on the backend, update
  it here too — there's no endpoint that returns these dynamically.

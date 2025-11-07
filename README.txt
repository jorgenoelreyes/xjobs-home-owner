===========================================================
XJOBS HOME-OWNER — BACKUP SNAPSHOT DOCUMENTATION
===========================================================

🕒 BACKUP DATE/TIME:
  20251018-093622

📦 SOURCE DIRECTORY:
  /Users/jorgereyes/xjobs/codigo/home-owner

💾 BACKUP LOCATION:
  /Users/jorgereyes/xjobs/backups_manual/20251018-093622

-----------------------------------------------------------
APPLICATION OVERVIEW
-----------------------------------------------------------

The XJobs Home-Owner Angular App provides a front-end interface 
for uploading, parsing, and viewing worker CVs, resumes, or job 
records.  It integrates with the Node.js Parser API running at
http://localhost:5050/parse.

Key folders:
  src/app/
    ├── app.component.*          → Main dashboard (chart + table)
    ├── components/upload-cvs/   → File-upload UI and CSV/PDF parsing
    └── services/parser-api.service.ts → Connects to backend /parse endpoint

-----------------------------------------------------------
CORE FUNCTIONALITY (as of this version)
-----------------------------------------------------------

✅ File Upload & Parsing (CSV, PDF, DOCX)
✅ Interactive Bar Chart (Chart.js) — click to filter
✅ Worker Table with 20+ data fields (name, trade, rate, location, etc.)
✅ Geocode support (if API key provided)
✅ Auto replace/append mode on upload
✅ Launch/Backup/Restore desktop automation

-----------------------------------------------------------
HOW TO USE THIS BACKUP
-----------------------------------------------------------

1. Double-click **XJobs-Restore-Manual.command** to restore this build.
2. Double-click **XJobs-Launch.command** to run the dev server.
3. Visit http://localhost:4300 to use the app.
4. To create another manual backup:
      Double-click **XJobs-Manual-Backup.command**

-----------------------------------------------------------
VERSION TRACE
-----------------------------------------------------------

• Oct-16-25: Upload module + parser integration
• Oct-17-25: Extended worker schema (address, rate, etc.)
• Oct-18-25: Stable build with automated backup/restore system

-----------------------------------------------------------
AUTHOR
-----------------------------------------------------------

  Jorge Reyes — XJobs Founder & Maintainer
  PureCipher / OmniSeal / GLIDE / XJobs Ecosystem
  (Generated automatically by ChatGPT 5 | Oct-2025)
===========================================================

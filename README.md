**DocuSwift**
🔗 **Live App:** https://crud-system-delta-six.vercel.app/

**AIT Lab Paper Management System**

A full-stack research paper management platform built for internal use in the AIT Lab.
This system streamlines the workflow of managing research papers, journal submissions, user access, review statuses, and admin operations — all with secure authentication and clean UI.

Built with Next.js, MongoDB, and Tailwind CSS.

🚀 Features
🔐 Authentication (Internal Use Only)

    No public registration
    Only admins can create/manage users
    Authenticated users are redirected directly to the Papers page
    Secure JWT-based login, logout, and role-based access control

📄 Paper Management

    Create, edit, and soft-delete papers
    Automatically manages:
    Title
    URL
    Authors (with corresponding author tagging)
    Real-time author suggestions (autocomplete)
    Full soft delete system:
    Papers are archived, not removed
    Admins can restore archived papers
    Deleted papers are hidden from users unless “Show Deleted” is enabled

📝 Journal Submission Workflow

    Each paper maintains a chronological journal history, tracking the full lifecycle of submissions.
    A journal record includes:
    Journal ID & Title
    Status (submitted, under_review, revision_submitted, rejected, accepted)
    date_submitted
    last_updated

✔ Submission Cycle Logic

    Submit paper → creates first journal entry (submitted)
    Status updates modify the latest journal entry
    On rejection → add a new journal submission entry
    The paper’s displayed status always reflects the latest journal’s status
    This matches real-world academic submission cycles.

👨‍💻 Admin Panel

    Admins have additional capabilities:

👥 Manage Users

    View all users
    Update:
    Password
    Name
    Email
    Role
    No public signup — admin-only user creation

🧪 Paper Status Dashboard

    View all papers
    Enable/disable “Show Deleted” mode
    Edit statuses
    Add new journal submissions
    Restore archived papers

🧾 Activity Logs

    Tracks:
    User actions
    Paper updates
    Restores
    Soft deletes
    Journal modifications
    (Logged with user ID, email, timestamps, and full before/after snapshots)

🧭 Navigation

A clean, fixed sidebar available on all pages:

📄 Papers

🧪 Paper Statuses

📓 Journals

👥 Manage Users (Admin only)

🧾 Logs (Admin only)

🔒 Logout
The navigation is fully role-aware and context-aware.

🛠 Tech Stack

    Frontend: Next.js (Pages Router), React

    Backend: Next.js API Routes

    Database: MongoDB Atlas with Mongoose

    Auth: JWT with HttpOnly cookies

    UI: Tailwind CSS

    Deployment: Vercel

🧹 Soft Delete Philosophy

    This project follows the real-world academic workflow:
    No data is ever permanently removed
    Papers can always be restored
    Historical logs are preserved permanently
    Journals and authors remain intact unless edited by admins

🛡 Security Notes

    Authenticated routes protected using requireAuth middleware
    Cookies are HttpOnly & secure
    User roles fully enforced on server side
    No public registration → prevents unauthorized access

🤝 Contributing

    Because this is an internal research system, contributions are limited to the AIT Lab team.
    For feature requests, bug reports, or improvements — contact the admin.

📄 License

    This project is for internal AIT Lab use only.
    Do not distribute or deploy publicly.

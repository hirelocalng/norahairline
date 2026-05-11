# Nora Hair Line — Setup Guide

## Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)

---

## 1. Database Setup

Open pgAdmin or psql and run:

```sql
CREATE DATABASE norahairline;
```

Then connect to the database and run the schema:
```
psql -U postgres -d norahairline -f backend/db/schema.sql
```

Or paste the contents of `backend/db/schema.sql` directly in pgAdmin.

---

## 2. Backend Setup

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set your values:
```
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/norahairline
JWT_SECRET=change-this-to-a-long-random-secret
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

Start the backend:
```bash
npm run dev
```

---

## 3. Frontend Setup

```bash
cd frontend
npm run dev
```

Open: http://localhost:5173

---

## 4. Admin Panel

- URL: http://localhost:5173/admin
- Default email: `admin@norahairline.com`
- Default password: `password`

**IMPORTANT:** Change the default admin password after first login.

To change the password, run this in psql:
```sql
-- Replace 'your_new_password_hash' with a bcrypt hash of your new password
-- You can generate one at: https://bcrypt-generator.com/
UPDATE admins SET password_hash = 'new_bcrypt_hash_here' WHERE email = 'admin@norahairline.com';
```

---

## 5. Project Structure

```
norahairline/
├── backend/
│   ├── db/
│   │   ├── index.js         # PostgreSQL connection
│   │   └── schema.sql       # Database schema + default admin
│   ├── middleware/
│   │   ├── auth.js          # JWT authentication
│   │   └── upload.js        # Multer image upload config
│   ├── routes/
│   │   ├── products.js      # Public product API
│   │   └── admin.js         # Admin API (protected)
│   ├── uploads/             # Uploaded images saved here
│   ├── server.js            # Express app entry point
│   └── .env                 # Your environment variables
│
└── frontend/
    └── src/
        ├── api/             # Axios API calls
        ├── components/      # Navbar, Footer, ProductCard
        ├── context/         # Auth context
        └── pages/
            ├── Home.jsx
            ├── Shop.jsx
            ├── ProductDetail.jsx
            ├── About.jsx
            └── admin/
                ├── AdminLogin.jsx
                ├── AdminDashboard.jsx
                ├── AdminProducts.jsx
                └── ProductForm.jsx
```

---

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | All available products |
| GET | /api/products/featured | Latest 8 products |
| GET | /api/products/categories | Category counts |
| GET | /api/products/:id | Single product with images |

### Admin (requires JWT token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/admin/login | Login |
| GET | /api/admin/dashboard | Stats |
| GET | /api/admin/products | All products |
| POST | /api/admin/products | Create product |
| PUT | /api/admin/products/:id | Update product |
| PATCH | /api/admin/products/:id/availability | Toggle availability |
| DELETE | /api/admin/products/:id | Delete product |

# GlobalSpace Blog API

The backend for the GlobalSpace blog application, built with **Node.js** and **Express** for Module 02 of my Codomax Digital Solutions virtual internship.

The React frontend that uses this API is here: [codomax-blog](https://github.com/Maxwel12744/codomax-blog)

## Features

- User registration and login
- Passwords are hashed with bcrypt and never stored as plain text
- Login tokens (JWT) that last 7 days
- Create, read, edit and delete blogs
- Only the author can edit or delete their own blog
- Input checks on every route, with clear JSON error messages

## Tech Stack

- Node.js and Express
- bcryptjs (password hashing)
- jsonwebtoken (login tokens)
- cors and dotenv

## Getting Started

1. Clone the repository and go into it:
   ```
   git clone https://github.com/Maxwel12744/codomax-blog-backend.git
   cd codomax-blog-backend
   ```
2. Install the packages:
   ```
   npm install
   ```
3. Create a file named `.env` in the project root (see `.env.example`) and add a secret key:
   ```
   JWT_SECRET=your-long-random-text
   ```
   You can generate one with:
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
4. Start the server:
   ```
   npm run dev
   ```
5. The API runs at `http://localhost:5000`.

## API Endpoints

Routes marked **Login required** need this header:
`Authorization: Bearer <token>`

### Auth

| Method | Route                | Login required | What it does                                         |
| ------ | -------------------- | -------------- | ---------------------------------------------------- |
| POST   | `/api/auth/register` | No             | Create an account. Body: `name`, `email`, `password` |
| POST   | `/api/auth/login`    | No             | Log in. Body: `email`, `password`                    |
| GET    | `/api/auth/me`       | Yes            | Get the logged-in user                               |

### Blogs

| Method | Route             | Login required    | What it does                                                          |
| ------ | ----------------- | ----------------- | --------------------------------------------------------------------- |
| GET    | `/api/blogs`      | No                | List all blogs, newest first. Optional filter: `?category=CSS`        |
| GET    | `/api/blogs/mine` | Yes               | List only your blogs                                                  |
| GET    | `/api/blogs/:id`  | No                | Get one blog                                                          |
| POST   | `/api/blogs`      | Yes               | Create a blog. Body: `title`, `category`, `content`, optional `image` |
| PUT    | `/api/blogs/:id`  | Yes (author only) | Edit a blog                                                           |
| DELETE | `/api/blogs/:id`  | Yes (author only) | Delete a blog                                                         |

### Rules

- Password: at least 6 characters
- Title: up to 100 characters. Category: up to 50 characters
- Content: at least 10 characters
- Image (optional): a PNG, JPG, WEBP or GIF sent as a data URL. Requests are limited to 5 MB

### Status codes

| Code      | Meaning                                         |
| --------- | ----------------------------------------------- |
| 200 / 201 | Success / created                               |
| 400       | Missing or invalid details                      |
| 401       | Not logged in, wrong password, or expired token |
| 403       | You are not the author of this blog             |
| 404       | Blog or route not found                         |
| 409       | An account with this email already exists       |

## Example (PowerShell)

Register, then create a blog:

```powershell
$body = @{ name = "Maxwel"; email = "max@example.com"; password = "secret123" } | ConvertTo-Json
$user = Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/register -ContentType "application/json" -Body $body

$headers = @{ Authorization = "Bearer $($user.token)" }
$blog = @{ title = "My first blog"; category = "Career Growth"; content = "This is my first blog post." } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/blogs -ContentType "application/json" -Headers $headers -Body $blog
```

## Project Structure

```
server.js            Starts the server and connects the routes
routes/auth.js       Register, login and "who am I"
routes/blogs.js      Blog routes
middleware/auth.js   Checks the login token
utils/db.js          Reads and writes the data files
data/                Users and blogs (created automatically, not uploaded to GitHub)
```

## Notes

- For Module 02, data is stored in JSON files inside `data/`. Module 03 replaces this with a real database.
- The `.env` file and the `data/` folder are in `.gitignore`, so secrets and user data are never uploaded.
- For safety, a wrong email and a wrong password give the same message, so nobody can find out which emails are registered.

## Author

Maxwel Ochieng Odhiambo
Computer Science, Codomax Digital Solutions Virtual Internship

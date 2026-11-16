// Blog routes: create, read, update and delete blog posts

const express = require("express");
const { readData, writeData } = require("../utils/db");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// Check the details of a blog. Returns an error message, or null if everything is fine.
function validateBlog({ title, category, content, image }) {
  if (!title || !category || !content) {
    return "Title, category and content are required.";
  }
  if (title.trim().length > 100) {
    return "Title must be 100 characters or less.";
  }
  if (category.trim().length > 50) {
    return "Category must be 50 characters or less.";
  }
  if (content.trim().length < 10) {
    return "Content must be at least 10 characters.";
  }
  // The image is optional. If it is sent, it must be an image sent as text (data URL).
  if (image && !/^data:image\/(png|jpe?g|webp|gif);base64,/.test(image)) {
    return "Image must be a PNG, JPG, WEBP or GIF file.";
  }
  return null;
}

// A short preview of the content, shown on blog cards
function makeExcerpt(content) {
  const text = content.trim();
  return text.length > 140 ? text.slice(0, 140).trim() + "…" : text;
}

// GET /api/blogs  -> every blog, newest first (anyone can read)
// Optional filter: /api/blogs?category=CSS
router.get("/", (req, res) => {
  let blogs = readData("blogs");

  if (req.query.category) {
    blogs = blogs.filter((b) => b.category === req.query.category);
  }

  blogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ count: blogs.length, blogs });
});

// GET /api/blogs/mine  -> only the logged-in user's blogs.
// This must come BEFORE "/:id", or "mine" would be treated as an id.
router.get("/mine", requireAuth, (req, res) => {
  const blogs = readData("blogs")
    .filter((b) => b.authorId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ count: blogs.length, blogs });
});

// GET /api/blogs/:id  -> one blog (anyone can read)
router.get("/:id", (req, res) => {
  const blog = readData("blogs").find((b) => b.id === Number(req.params.id));

  if (!blog) {
    return res.status(404).json({ message: "Blog not found." });
  }
  res.json({ blog });
});

// POST /api/blogs  -> create a blog (must be logged in)
router.post("/", requireAuth, (req, res) => {
  const { title, category, content, image } = req.body || {};

  const problem = validateBlog({ title, category, content, image });
  if (problem) {
    return res.status(400).json({ message: problem });
  }

  const blogs = readData("blogs");
  const newBlog = {
    id: Date.now(),
    title: title.trim(),
    category: category.trim(),
    content: content.trim(),
    excerpt: makeExcerpt(content),
    image: image || "",
    authorId: req.user.id, // taken from the login token, not from the request body
    authorName: req.user.name,
    createdAt: new Date().toISOString(),
  };

  blogs.push(newBlog);
  writeData("blogs", blogs);

  res
    .status(201)
    .json({ message: "Blog created successfully.", blog: newBlog });
});

// PUT /api/blogs/:id  -> edit a blog (only its author)
router.put("/:id", requireAuth, (req, res) => {
  const blogs = readData("blogs");
  const blog = blogs.find((b) => b.id === Number(req.params.id));

  if (!blog) {
    return res.status(404).json({ message: "Blog not found." });
  }
  if (blog.authorId !== req.user.id) {
    return res
      .status(403)
      .json({ message: "You can only edit your own blogs." });
  }

  // Keep the old value for anything that was not sent
  const title = req.body.title !== undefined ? req.body.title : blog.title;
  const category =
    req.body.category !== undefined ? req.body.category : blog.category;
  const content =
    req.body.content !== undefined ? req.body.content : blog.content;
  const image = req.body.image !== undefined ? req.body.image : blog.image;

  const problem = validateBlog({ title, category, content, image });
  if (problem) {
    return res.status(400).json({ message: problem });
  }

  blog.title = title.trim();
  blog.category = category.trim();
  blog.content = content.trim();
  blog.excerpt = makeExcerpt(content);
  blog.image = image || "";
  blog.updatedAt = new Date().toISOString();

  writeData("blogs", blogs);
  res.json({ message: "Blog updated successfully.", blog });
});

// DELETE /api/blogs/:id  -> delete a blog (only its author)
router.delete("/:id", requireAuth, (req, res) => {
  const blogs = readData("blogs");
  const blog = blogs.find((b) => b.id === Number(req.params.id));

  if (!blog) {
    return res.status(404).json({ message: "Blog not found." });
  }
  if (blog.authorId !== req.user.id) {
    return res
      .status(403)
      .json({ message: "You can only delete your own blogs." });
  }

  writeData(
    "blogs",
    blogs.filter((b) => b.id !== blog.id),
  );
  res.json({ message: "Blog deleted successfully." });
});

module.exports = router;

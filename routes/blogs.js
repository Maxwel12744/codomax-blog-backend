// Blog routes: create, read, update and delete blog posts

const User = require("../models/User");
const express = require("express");
const mongoose = require("mongoose");
const Blog = require("../models/Blog");
const requireAuth = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = express.Router();

// Check the details of a blog. Returns an error message, or null if everything is fine.
function validateBlog({ title, category, content, image }) {
  if (!title || !category || !content) {
    return "Title, category and content are required.";
  }
  if (
    typeof title !== "string" ||
    typeof category !== "string" ||
    typeof content !== "string"
  ) {
    return "Title, category and content must be text.";
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
  if (
    image &&
    (typeof image !== "string" ||
      !/^data:image\/(png|jpe?g|webp|gif);base64,/.test(image))
  ) {
    return "Image must be a PNG, JPG, WEBP or GIF file.";
  }
  return null;
}

// A short preview of the content, shown on blog cards
function makeExcerpt(content) {
  const text = content.trim();
  return text.length > 140 ? text.slice(0, 140).trim() + "…" : text;
}

// Find a blog by the id in the address. Returns null if the id is not valid or not found.
async function findBlog(id) {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }
  return Blog.findById(id);
}

// GET /api/blogs  -> every blog, newest first (anyone can read)
// Optional filter: /api/blogs?category=CSS
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = {};

    // Only accept plain text here, so nobody can send a database command instead
    if (typeof req.query.category === "string" && req.query.category) {
      filter.category = req.query.category;
    }

    const blogs = await Blog.find(filter).sort({ createdAt: -1 });
    res.json({ count: blogs.length, blogs });
  }),
);

// GET /api/blogs/mine  -> only the logged-in user's blogs.
// This must come BEFORE "/:id", or "mine" would be treated as an id.
router.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const blogs = await Blog.find({ author: req.user.id }).sort({
      createdAt: -1,
    });
    res.json({ count: blogs.length, blogs });
  }),
);

// GET /api/blogs/:id  -> one blog (anyone can read)
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const blog = await findBlog(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found." });
    }
    res.json({ blog });
  }),
);

// POST /api/blogs  -> create a blog (must be logged in)
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { title, category, content, image } = req.body || {};

    const problem = validateBlog({ title, category, content, image });
    if (problem) {
      return res.status(400).json({ message: problem });
    }

    const blog = await Blog.create({
      title: title.trim(),
      category: category.trim(),
      content: content.trim(),
      excerpt: makeExcerpt(content),
      image: image || "",
      author: req.user.id, // taken from the login token, not from the request body
      authorName: req.user.name,
    });

    res.status(201).json({ message: "Blog created successfully.", blog });
  }),
);

// PUT /api/blogs/:id  -> edit a blog (only its author)
router.put(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const blog = await findBlog(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found." });
    }
    if (blog.author.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You can only edit your own blogs." });
    }

    // Keep the old value for anything that was not sent
    const body = req.body || {};
    const title = body.title !== undefined ? body.title : blog.title;
    const category =
      body.category !== undefined ? body.category : blog.category;
    const content = body.content !== undefined ? body.content : blog.content;
    const image = body.image !== undefined ? body.image : blog.image;

    const problem = validateBlog({ title, category, content, image });
    if (problem) {
      return res.status(400).json({ message: problem });
    }

    blog.title = title.trim();
    blog.category = category.trim();
    blog.content = content.trim();
    blog.excerpt = makeExcerpt(content);
    blog.image = image || "";
    await blog.save();

    res.json({ message: "Blog updated successfully.", blog });
  }),
);

// DELETE /api/blogs/:id  -> delete a blog (only its author)
router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const blog = await findBlog(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found." });
    }
    if (blog.author.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You can only delete your own blogs." });
    }

    await blog.deleteOne();
    res.json({ message: "Blog deleted successfully." });
  }),
);

module.exports = router;

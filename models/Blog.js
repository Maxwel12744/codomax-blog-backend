// What a blog post looks like in the database

const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, required: true, trim: true, maxlength: 50 },
    content: { type: String, required: true, trim: true, minlength: 10 },
    excerpt: { type: String, default: "" },
    image: { type: String, default: "" },
    // The user who wrote the blog
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    authorName: { type: String, required: true },
  },
  { timestamps: true },
);

// Send the blog to the frontend in the shape it expects
blogSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.authorId = ret.author.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.author;
    return ret;
  },
});

module.exports = mongoose.model("Blog", blogSchema);

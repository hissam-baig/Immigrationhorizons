const mongoose = require('mongoose');
const slugify = require('slugify');
const blogCategories = require('../utils/blogCategories');

const BlogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: {
      type: String,
      enum: blogCategories,
      default: 'Immigration Tips',
    },
    excerpt: { type: String, required: true, trim: true, maxlength: 300 },
    content: { type: String, required: true }, // HTML from the admin editor
    coverImage: { type: String, default: '' }, // /uploads/xyz.jpg or external URL
    author: { type: String, default: 'Immigration Horizons Team' },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

BlogPostSchema.pre('validate', function (next) {
  if (this.title && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('BlogPost', BlogPostSchema);

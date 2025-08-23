const { Router } = require("express");
const Blog = require("../models/blog");
const Comment = require("../models/comments");
const { upload } = require("../config/cloudinary"); // <-- Import Cloudinary upload

const router = Router();

// ✅ Middleware to check login
function requireLogin(req, res, next) {
  if (!req.user) {
    return res.status(401).send("You must be logged in");
  }
  next();
}

// ✅ Middleware to check if user is blog author
async function requireAuthor(req, res, next) {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");

    if (blog.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send("Unauthorized");
    }

    req.blog = blog;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error checking author");
  }
}

// ✅ Add Blog Page
router.get("/add-new", requireLogin, (req, res) => {
  res.render("addblog", { user: req.user });
});

// ✅ Single Blog Page
router.get("/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate("createdBy");
  const comments = await Comment.find({ blogId: req.params.id }).populate("createdBy");

  return res.render("blog", { user: req.user, blog, comments });
});

// ✅ Add Comment
router.post("/comment/:blogId", requireLogin, async (req, res) => {
  await Comment.create({
    content: req.body.content,
    blogId: req.params.blogId,
    createdBy: req.user._id,
  });
  return res.redirect(`/blog/${req.params.blogId}`);
});

// ✅ Add Blog (POST)
router.post("/", requireLogin, upload.single("coverImage"), async (req, res) => {
  const { title, body } = req.body;
  const blog = await Blog.create({
    title,
    body,
    createdBy: req.user._id,
    coverImageURL: req.file ? req.file.path : null, // Cloudinary returns URL
  });
  return res.redirect(`/blog/${blog._id}`);
});

// ✅ Edit Blog (Form page)
router.get("/edit/:id", requireLogin, requireAuthor, (req, res) => {
  res.render("editBlog", { user: req.user, blog: req.blog });
});

// ✅ Update Blog (POST)
router.post("/edit/:id", requireLogin, requireAuthor, upload.single("coverImage"), async (req, res) => {
  try {
    const { title, body } = req.body;
    const updateData = { title, body };

    if (req.file) {
      updateData.coverImageURL = req.file.path; // Cloudinary URL
    }

    await Blog.findByIdAndUpdate(req.params.id, updateData);
    res.redirect(`/blog/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating blog");
  }
});

// ✅ Delete Blog
router.get("/delete/:id", requireLogin, requireAuthor, async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting blog");
  }
});

module.exports = router;

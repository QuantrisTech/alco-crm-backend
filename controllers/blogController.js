const Blog = require("../models/blogModel.js");


// Public
exports.getBlogs = async (req, res) => {
  try {
    // ✅ Yeh missing tha
    const { page = 1, limit = 9, category, search } = req.query;

    const query = { status: "published" };
    if (category) query.category = category;
    if (search) query.$or = [
      { title: { $regex: search, $options: "i" } },
      { excerpt: { $regex: search, $options: "i" } },
    ];

    const blogs = await Blog.find(query)
      .populate("author", "name")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Blog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: blogs,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug, status: "published" },
      { $inc: { views: 1 } },
      { new: true }
    ).populate("author", "name");

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    // ✅ Seedha blog object bhejo — sab fields automatically aayengi
    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Naya admin endpoint add karo
exports.adminGetBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug })
      .populate("author", "name");

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const blogObj = blog.toObject({ versionKey: false });

    console.log("blogObj._id:", blogObj._id); // ✅ dekho kya aata hai

    res.status(200).json({
      success: true,
      data: {
        ...blogObj,
        id: String(blogObj._id), // ✅ String() safe hai toString() se
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adminGetBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: "i" };

    const blogs = await Blog.find(query)
      .populate("author", "name")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Blog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: blogs,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)), // ✅ Yeh add kiya
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// exports.adminCreateBlog = async (req, res) => {
//   try {
//     const { title } = req.body;
//     const slug = title.toLowerCase().replace(/ /g, '-'); // Generate slug from title
 
//     // Check for existing title or slug
//     const existingBlog = await Blog.findOne({ $or: [{ title }, { slug }] });
 
//     if (existingBlog) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Blog with this title or slug already exists" 
//       });
//     }
 
//     // Create new blog
//     const newBlog = await Blog.create({ title, slug });
//     res.status(201).json({ success: true, message: "Blog created", data: newBlog });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Export other functions as needed
// exports.adminUpdateBlog = async (req, res) => {
//   try {
//     const { title } = req.body;
//     const slug = title.toLowerCase().replace(/ /g, '-'); // Generate new slug based on updated title
 
//     // Check if the blog exists
//     const existingBlog = await Blog.findOne({ slug: req.params.slug });
 
//     if (!existingBlog) {
//       return res.status(404).json({ success: false, message: "Blog not found" });
//     }
 
//     // Check for existing title or slug in other blogs excluding the current one
//     const duplicateBlog = await Blog.findOne({
//       $or: [{ title }, { slug }],
//       _id: { $ne: existingBlog._id } // Exclude the current blog
//     });
 
//     if (duplicateBlog) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Another blog with this title or slug already exists" 
//       });
//     }
 
//     // Update the blog
//     existingBlog.title = title;
//     existingBlog.slug = slug; // Update to new slug
//     const updatedBlog = await existingBlog.save();
 
//     res.status(200).json({ success: true, message: "Blog updated", data: updatedBlog });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

exports.adminCreateBlog = async (req, res) => {
  try {
    const { title, status, content, thumbnail, category, tags, excerpt, read_time, is_featured } = req.body;
    const slug = title.toLowerCase().replace(/ /g, '-');

    const existingBlog = await Blog.findOne({ $or: [{ title }, { slug }] });
    if (existingBlog) {
      return res.status(400).json({ 
        success: false, 
        message: "Blog with this title or slug already exists" 
      });
    }

    const newBlog = await Blog.create({
      title,
      slug,
      status,
      content,
      thumbnail,
      category,
      tags,
      excerpt,
      read_time,
      is_featured,
      author: req.user?._id, // agar protect middleware se user mil raha hai
    });

    res.status(201).json({ success: true, message: "Blog created", data: newBlog });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export other functions as needed
exports.adminUpdateBlog = async (req, res) => {
  try {
    const { title, status, content, thumbnail, category, tags, excerpt, read_time, is_featured } = req.body;

    // ✅ frontend slug bhejta hai identifier ke taur pe, route param ka naam :id hai
    const existingBlog = await Blog.findOne({ slug: req.params.id });

    if (!existingBlog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const slug = title ? title.toLowerCase().replace(/ /g, '-') : existingBlog.slug;

    if (title) {
      const duplicateBlog = await Blog.findOne({
        $or: [{ title }, { slug }],
        _id: { $ne: existingBlog._id }
      });
      if (duplicateBlog) {
        return res.status(400).json({ 
          success: false, 
          message: "Another blog with this title or slug already exists" 
        });
      }
      existingBlog.title = title;
      existingBlog.slug = slug;
    }

    if (status !== undefined) existingBlog.status = status;
    if (content !== undefined) existingBlog.content = content;
    if (thumbnail !== undefined) existingBlog.thumbnail = thumbnail;
    if (category !== undefined) existingBlog.category = category;
    if (tags !== undefined) existingBlog.tags = tags;
    if (excerpt !== undefined) existingBlog.excerpt = excerpt;
    if (read_time !== undefined) existingBlog.read_time = read_time;
    if (is_featured !== undefined) existingBlog.is_featured = is_featured;

    const updatedBlog = await existingBlog.save();

    res.status(200).json({ success: true, message: "Blog updated", data: updatedBlog });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 

exports.adminDeleteBlog = async (req, res) => {
  try {
    await Blog.findOneAndDelete({ slug: req.params.id });
    res.status(200).json({ success: true, message: "Blog deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adminPublishBlog = async (req, res) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.id },
      { status: "published" },
      { new: true }
    );
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
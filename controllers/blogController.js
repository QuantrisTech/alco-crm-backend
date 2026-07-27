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

    // const blogs = await Blog.find(query)
    //   .populate("author", "name")
    //   .sort({ createdAt: -1 })
    //   .skip((Number(page) - 1) * Number(limit))
    //   .limit(Number(limit));

    const blogs = await Blog.find(query)
      .populate("author", "name")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    // const formattedBlogs = blogs.map((blog) => {
    //   const obj = blog.toObject(); // 👈 important
    //   obj.id = obj._id;
    //   delete obj._id;
    //   delete obj.__v;
    //   return obj;
    // });

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
//     const { title, slug, thumbnail } = req.body;

//     const finalSlug = slug
//       ? slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
//       : title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

//     // ✅ Condition 1 — slug/title already exists
//     const existing = await Blog.findOne({ slug: finalSlug });
//     if (existing) {
//       return res.status(400).json({
//         success: false,
//         message: `Blog with this title already exists`, // ✅ clear message
//       });
//     }

//     const blog = await Blog.create({
//       ...req.body,
//       slug: finalSlug,
//       author: req.user.id,
//       thumbnail,
//     });

//     res.status(201).json({ success: true, data: blog });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

exports.adminCreateBlog = async (req, res) => {
  try {
    const { title } = req.body;
    const slug = title.toLowerCase().replace(/ /g, '-'); // Generate slug from title
 
    // Check for existing title or slug
    const existingBlog = await Blog.findOne({ $or: [{ title }, { slug }] });
 
    if (existingBlog) {
      return res.status(400).json({ 
        success: false, 
        message: "Blog with this title or slug already exists" 
      });
    }
 
    // Create new blog
    const newBlog = await Blog.create({ title, slug });
    res.status(201).json({ success: true, message: "Blog created", data: newBlog });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// exports.adminUpdateBlog = async (req, res) => {
//   try {
//     const { title, ...rest } = req.body;

//     // ✅ Condition 3 — title se naya slug banao
//     const newSlug = title
//       ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
//       : null;

//     // ✅ Condition 2 — slug already exist karta hai kisi AUR blog mein
//     if (newSlug) {
//       const existing = await Blog.findOne({
//         slug: newSlug,
//         slug: { $ne: req.params.id }, // current blog ko exclude karo
//       });
//       if (existing) {
//         return res.status(400).json({
//           success: false,
//           message: "Blog with this title already exists",
//         });
//       }
//     }

//     const updateData = {
//       ...rest,
//       ...(title && { title }),
//       ...(newSlug && { slug: newSlug }), // ✅ slug update
//     };

//     const blog = await Blog.findOneAndUpdate(
//       { slug: req.params.id },
//       updateData,
//       { new: true }
//     );

//     if (!blog) return res.status(404).json({ message: "Blog not found" });
//     res.status(200).json({ success: true, data: blog });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


// Function to update a blog

// exports.adminUpdateBlog = async (req, res) => {
//   try {
//     const { title, slug } = req.body;

//     // Check if the title already exists in another blog
//     const existingBlog = await Blog.findOne({ title: title, slug: { $ne: req.params.slug } });

//     if (existingBlog) {
//       return res.status(400).json({ success: false, message: "Blog with this title already exists" });
//     }

//     // Proceed to update the blog
//     const updatedBlog = await Blog.findOneAndUpdate(
//       { slug: req.params.slug },
//       { title, slug },
//       { new: true }
//     );

//     if (!updatedBlog) {
//       console.error(`Blog with slug ${req.params.slug} not found`);
//       return res.status(404).json({ success: false, message: "Blog not found" });
//     }


//     res.status(200).json({ success: true, message: "Blog updated", data: updatedBlog });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// Export other functions as needed

exports.adminUpdateBlog = async (req, res) => {
  try {
    const { title } = req.body;
    const slug = title.toLowerCase().replace(/ /g, '-'); // Generate new slug based on updated title
 
    // Check if the blog exists
    const existingBlog = await Blog.findOne({ slug: req.params.slug });
 
    if (!existingBlog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }
 
    // Check for existing title or slug in other blogs excluding the current one
    const duplicateBlog = await Blog.findOne({
      $or: [{ title }, { slug }],
      _id: { $ne: existingBlog._id } // Exclude the current blog
    });
 
    if (duplicateBlog) {
      return res.status(400).json({ 
        success: false, 
        message: "Another blog with this title or slug already exists" 
      });
    }
 
    // Update the blog
    existingBlog.title = title;
    existingBlog.slug = slug; // Update to new slug
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

// exports.adminPublishBlog = async (req, res) => {
//   try {
//     const blog = await Blog.findByIdAndUpdate(
//       req.params.id,
//       { status: "published" },
//       { new: true }
//     );
//     res.status(200).json({ success: true, data: blog });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

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
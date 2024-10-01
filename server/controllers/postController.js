import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/postmodel.js";
import { User } from "../models/usermodel.js";
import { Comment } from "../models/commentmodel.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const addNewPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const image = req.file;
    const authorId = req.id;

    if (!image) return res.status(400).json({ message: "Image required" });

    // image upload
    const optimizedImageBuffer = await sharp(image.buffer)
      .resize({ width: 800, height: 800, fit: "inside" })
      .toFormat("jpeg", { quality: 80 })
      .toBuffer();

    // buffer to data uri
    const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString(
      "base64"
    )}`;
    // upload to cloudinary and get secure url
    const cloudResponse = await cloudinary.uploader.upload(fileUri);
    // create post and add to user posts array
    const post = await Post.create({
      caption,
      image: cloudResponse.secure_url,
      author: authorId,
    });
    // add post id to user's posts array
    const user = await User.findById(authorId);
    if (user) {
      user.posts.push(post._id);
      await user.save();
    }

    await post.populate({
      path: "author",
      select: "-password",
    });

    return res.status(201).json({
      message: "New post added",
      post,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
export const getAllPost = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "author",
        select: "username profilePicture",
      })
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "username profilePicture",
        },
      });
    return res.status(200).json({
      posts,
      success: true,
      message: "Posts fetched successfully",
    });
  } catch (error) {
    console.log(error);
  }
};
export const getUserPost = async (req, res) => {
  try {
    const authorId = req.id;
    const posts = await Post.find({ author: authorId }) // Find posts by author ID
      .sort({ createdAt: -1 }) // Sort posts by creation date (latest first)
      .populate({
        path: "author",
        select: "username profilePicture",
      })
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "username profilePicture",
        },
      });
    return res.status(200).json({
      posts,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
export const likePost = async (req, res) => {
  try {
    const userIdToLike = req.id;
    const postId = req.params.id;

    // Find the post by ID
    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
      userIdToLike;
    }

    // Like logic
    // Use $addToSet to avoid duplicate likes
    await post.updateOne({ $addToSet: { likes: userIdToLike } });

    // Optionally, you don't need to call save after updateOne
    // await post.save(); // Not needed since updateOne handles it

    // Implement socket.io for real-time notification
    const user = await User.findById(userIdToLike).select(
      "username profilePicture"
    );
    const postOwnerId = post.author.toString();

    if (postOwnerId !== userIdToLike) {
      // Emit a notification event
      const notification = {
        type: "like",
        userId: userIdToLike,
        userDetails: user,
        postId,
        message: "Your post was liked",
      };

      const postOwnerSocketId = getReceiverSocketId(postOwnerId);
      io.to(postOwnerSocketId).emit("notification", notification);
    }

    return res.status(200).json({
      message: "Post liked",
      success: true,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res
      .status(500)
      .json({
        message: "An error occurred",
        success: false,
        error: error.message,
      });
  }
};
export const dislikePost = async (req, res) => {
  try {
    const userIdToLike = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ message: "Post not found", success: false });

    // like logic started
    await post.updateOne({ $pull: { likes: userIdToLike } });
    await post.save();

    // implement socket io for real time notification
    const user = await User.findById(userIdToLike).select(
      "username profilePicture"
    );
    const postOwnerId = post.author.toString();
    if (postOwnerId !== userIdToLike) {
      // emit a notification event
      const notification = {
        type: "dislike",
        userId: userIdToLike,
        userDetails: user,
        postId,
        message: "Your post was liked",
      };
      const postOwnerSocketId = getReceiverSocketId(postOwnerId);
      io.to(postOwnerSocketId).emit("notification", notification);
    }

    return res.status(200).json({
      message: "Post disliked",
      success: true,
    });
  } catch (error) {}
};
export const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const CommenterUserID = req.id;

    const { text } = req.body;

    const post = await Post.findById(postId);

    if (!text)
      return res.status(400).json({
        message: "text is required",
        success: false,
      });

    const comment = await Comment.create({
      text,
      author: CommenterUserID,
      post: postId,
    });

    await comment.populate({
      path: "author",
      select: "username profilePicture",
    });

    post.comments.push(comment._id);
    await post.save();

    return res.status(201).json({
      message: "Comment Added",
      comment,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
export const getCommentsOfPost = async (req, res) => {
  try {
    const postId = req.params.id;

    // Fetch comments for the post and populate author details
    const comments = await Comment.find({ post: postId }).populate(
      "author",
      "username profilePicture"
    );

    // Check if there are no comments
    if (comments.length === 0) {
      return res
        .status(404)
        .json({ message: "No comments found for this post", success: false });
    }

    // Return the comments if found
    return res.status(200).json({ success: true, comments });
  } catch (error) {
    // Log the error and send 500 status
    console.error("Error fetching comments:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};
export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;

    const post = await Post.findById(postId);

    if (!post)
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });

    // check if the logged-in user is the owner of the post
    if (post.author.toString() !== authorId)
      return res.status(403).json({
        message: "Unauthorized",
      });

    // delete post
    await Post.findByIdAndDelete(postId);

    // remove the post id from the user's post
    let user = await User.findById(authorId);
    user.posts = user.posts.filter((id) => id.toString() !== postId);
    await user.save();

    // delete associated comments
    await Comment.deleteMany({ post: postId });

    return res.status(200).json({
      success: true,
      message: "Post deleted",
    });
  } catch (error) {
    console.log(error);
  }
};
export const bookmarkPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;

    // Find user by authorId
    const user = await User.findById(authorId);

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    // Check if the user has already bookmarked the post
    if (user.bookmarks.includes(postId)) {
      // Remove the bookmark if already added
      await user.updateOne({ $pull: { bookmarks: postId } });
      return res.status(200).json({
        type: "unsaved",
        message: "Post removed from bookmarks",
        success: true,
      });
    } else {
      // Add the bookmark if not already there
      await user.updateOne({ $addToSet: { bookmarks: postId } });
      return res.status(200).json({
        type: "saved",
        message: "Post bookmarked",
        success: true,
      });
    }
  } catch (error) {
    console.error("Error bookmarking post:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

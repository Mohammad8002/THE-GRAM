import { User } from "../models/usermodel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/postmodel.js"
 
export const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        const user = new User({ username, email, password });
        await user.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        // Catch validation errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation error', error: err.message });
        }

        // Catch any other errors
        res.status(500).json({ message: 'Error creating user', error: err.message });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(401).json({
                message: "Something is missing, please check!",
                success: false,
            });
        }
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                message: "Incorrect email or password",
                success: false,
            });
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Incorrect email or password",
                success: false,
            });
        };

        const token = await jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1d' });

        // populate each post if in the posts array
        const populatedPosts = await Promise.all(
            user.posts.map( async (postId) => {
                const post = await Post.findById(postId);
                if(post.author.equals(user._id)){
                    return post;
                }
                return null;
            })
        )
        user = {
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            posts: populatedPosts
        }
        return res.cookie('token', token, { httpOnly: true, sameSite: 'strict', maxAge: 1 * 24 * 60 * 60 * 1000 }).json({
            message: `Welcome back ${user.username}`,
            success: true,
            user
        });

    } catch (error) {
        console.log(error);
    }
};

export const logout = async (_, res) => {
    try {
        return res.cookie("token", "", { maxAge: 0 }).json({
            message: 'Logged out successfully.',
            success: true
        });
    } catch (error) {
        console.log(error);
    }
};

export const getProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Find the user by ID, populate posts sorted by createdAt in descending order, and populate bookmarks
        let user = await User.findById(userId).select('-password')
        .populate({
            path: 'posts',
            options: { sort: { createdAt: -1 } } 
        })
        .populate('bookmarks'); 
        if (!user) {
            return res.status(404).json({ message: 'User not found', success: false });
        }

        return res.status(200).json({
            user,
            success: true
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'An error occurred while fetching the profile',
            success: false
        });
    }
};


export const editProfile = async (req, res) => {
    try {
        const userId = req.id;
        const { bio, gender } = req.body;
        const profilePicture = req.file;
        let cloudResponse;

        if (profilePicture) {
            const fileUri = getDataUri(profilePicture);
            cloudResponse = await cloudinary.uploader.upload(fileUri);
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                message: 'User not found.',
                success: false
            });
        };
        if (bio) user.bio = bio;
        if (gender) user.gender = gender;
        if (profilePicture) user.profilePicture = cloudResponse.secure_url;

        await user.save();

        return res.status(200).json({
            message: 'Profile updated.',
            success: true,
            user
        });

    } catch (error) {
        console.log(error);
    }
};

export const getSuggestedUsers = async (req, res) => {
    try {
        const suggestedUsers = await User.find({ _id: { $ne: req.id } }).select("-password");
        if (!suggestedUsers) {
            return res.status(400).json({
                message: 'Currently do not have any users',
            })
        };
        return res.status(200).json({
            success: true,
            users: suggestedUsers
        })
    } catch (error) {
        console.log(error);
    }
}

export const followOrUnfollow = async (req, res) => {
    try {
        const follower = req.id; 
        const whoIwillFollow = req.params.id;
        if (follower === whoIwillFollow) {
            return res.status(400).json({
                message: 'You cannot follow/unfollow yourself',
                success: false
            });
        }
        const user = await User.findById(follower);
        const targetUser = await User.findById(whoIwillFollow);

        if (!user || !targetUser) {
            return res.status(400).json({
                message: 'User not found',
                success: false
            });
        }
    //I will check whether to follow or unfollow
        const isFollowing = user.following.includes(whoIwillFollow);
        if (isFollowing) {
        //Unfollow logic will come. 
        await Promise.all([
            User.updateOne({ _id: follower },
              { $pull: { 
                following:   whoIwillFollow 
              } 
            }),
            User.updateOne({
                 _id: whoIwillFollow 
                }, 
                {$pull: { 
                 followers: follower 
                }
            }),
        ]) 
        return res.status(200).json({ 
            message: 'Unfollowed successfully', success: true })
        } else {
            //Fallow logic here
            await Promise.all([
                User.updateOne({
                     _id:  follower 
                    },
                    {$push: 
                    { 
                    following: whoIwillFollow 
                    } 
                }),
                User.updateOne({ 
                    _id: whoIwillFollow 
                    },
                    {$push:
                    {
                     followers: follower
                    } 
                }),
            ])
            return res.status(200).json({ message: 'followed successfully', success: true });
        }
    } catch (error) {
        console.log(error);
    }
}


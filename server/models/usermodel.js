import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    username:{
        type:String,
         required:true,
          unique:true,
          minlength: 3
        },
    email:{
        type:String,
        required:true,
        unique:true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
    },
    password:{
        type:String,
        required:true
    },
    profilePicture:{
        type:String,
        default:''
    },
    bio:{
        type:String,
         default:''
    },
    gender:{
        type:String,
        enum:['male','female']
    },
    followers:[{
        type:mongoose.Schema.Types.ObjectId, ref:'User'
    }],
    following:[{
        type:mongoose.Schema.Types.ObjectId, ref:'User'
    }],
    posts: [{ 
        type: mongoose.Schema.Types.ObjectId, ref: 'Post' 
    }],
    bookmarks: [{ 
        type: mongoose.Schema.Types.ObjectId, ref: 'Post' 
    }]
},
{timestamps:true}
);
//pre-save
userSchema.pre('save', async function (next) {
    try {
        if (!this.isModified('password')) {
            return next();
        }
        const hashedPassword = await bcrypt.hash(this.password, 10);
        this.password = hashedPassword;
        next();
    } catch (err) {
        next(err);
    }
});

export const User = mongoose.model('User', userSchema);
import express from "express";
import { editProfile, followOrUnfollow, getProfile, getSuggestedUsers, loginUser, logout, registerUser } from "../controllers/userController.js";
import isAuthenticated from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/logout').get(logout);
router.route('/:id/profile').get(isAuthenticated,  getProfile);
router.route('/profile/edit')
  .post(isAuthenticated, upload.single('profilePhoto'), editProfile);
router.route('/suggested').get(isAuthenticated, getSuggestedUsers);
router.route('/followorunfollow/:id').post(isAuthenticated, followOrUnfollow);

export default router;
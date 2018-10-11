const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

// Load the post model
const Post = require("../../models/Post");
// Load the profile model
const Profile = require("../../models/Profile");

// Load Validations
const validatePostInput = require("../../validations/post");
// @route GET api/posts/test
// @desc Tests Posts route
// @access public
router.get("/test", (req, res) => {
  res.json({ msg: "Posts Works" });
});

// @route POST api/posts
// @desc Create Posts
// @access private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);
    if (!isValid) {
      // If any errors, send 400 with errors object
      return res.status(400).json(errors);
    }
    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });
    newPost.save().then(post => res.json(post));
  }
);

// @route GET api/posts
// @desc get Posts
// @access public
router.get("/", (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err =>
      res.status(400).json({ noPostsFound: "No posts found with that Id" })
    );
});

// @route GET api/posts/:id
// @desc get Posts
// @access public
router.get("/:id", (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err =>
      res.status(400).json({ noPostFound: "No post found with that Id" })
    );
});

// @route Delete api/posts/:id
// @desc delete Posts
// @access public
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id).then(post => {
        // Check the post owner
        if (post.user.toString() !== req.user.id) {
          return res.status(401).json({ notAuthorized: "User not Auhtorized" });
        } else {
          // Delete
          post
            .remove()
            .then(() => res.json({ success: true }))
            .catch(err =>
              res.status(404).json({ postNotFound: "Post not Found" })
            );
        }
      });
    });
  }
);

// @route Post api/posts/like/:id
// @desc Like Posts
// @access Private
router.post(
  "/like/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          // Check the post owner
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length > 0
          ) {
            return res
              .status(400)
              .json({ Error: "Alread Liked, User already liked this post" });
          } else {
            // add userid to the likes array
            post.likes.unshift({ user: req.user.id });
            post.save().then(post => res.json(post));
          }
        })
        .catch(err => res.status(404).json({ postNotFound: "Post not Found" }));
    });
  }
);

// @route Post api/posts/unlike/:id
// @desc Unlike Posts
// @access Private
router.post(
  "/unlike/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          // Check the post owner
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length === 0
          ) {
            return res
              .status(400)
              .json({ Error: "You have not yet liked this post" });
          } else {
            // remove index of the user in the likes array
            const removeIndex = post.likes
              .map(item => item.user.toString())
              .indexOf(req.user.id);

            //Splice it out of the array
            post.likes.splice(removeIndex, 1);

            post.save().then(post => res.json(post));
          }
        })
        .catch(err => res.status(404).json({ postNotFound: "Post not Found" }));
    });
  }
);

// @route Post api/posts/comment/:id
// @desc  Add a comment to Posts
// @access Private

router.post(
  "/comment/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);
    if (!isValid) {
      // If any errors, send 400 with errors object
      return res.status(400).json(errors);
    }
    Post.findById(req.params.id)
      .then(post => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id
        };
        // Add to comments array
        post.comments.unshift(newComment);
        post.save().then(post => res.json(post));
      })
      .catch(err => res.json(err));
  }
);

// @route Delete api/posts/comment/:id/:comment_id
// @desc  Delete a comment from Posts
// @access Private

router.delete(
  "/comment/:id/:comment_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        // Check to see if comment exists
        if (
          post.comments.filter(
            comment => comment.id.toString() == req.params.comment_id
          ).length == 0
        ) {
          // Comment that we want to delete dosen't actually exist
          return res
            .status(404)
            .json({ commentnotexist: "Comment dosen't exist" });
        }
        // Get the remove index
        const removeIndex = post.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id);

        // Splice it out of the array
        post.comment.splice(removeIndex, 1);
        post.save().then(post => res.json(post));
      })
      .catch(err => res.json(err));
  }
);

module.exports = router;

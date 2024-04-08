var express = require('express');
var router = express.Router();
var bcrypt =  require('bcrypt');
const multer = require("multer");
const uuid = require("uuid").v4;


const handlebarsHelpers = require('handlebars-helpers')();

const { db } = require('../database');
const path = require('path');
const { insertUser, checkUsernameExists, query , insertUserCourse ,deleteUserCourse } = require('../database');

router.get('/signup', function(req, res, next) {
  res.render('users.hbs', { title: 'Example' });
});

router.get('/signin', function(req, res, next) {
  res.render('login.hbs', { title: 'Example' });
});


// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Specify the destination folder
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });


router.post('/profile', upload.single('profilePic'), async function(req, res, next) {
    try {
        // Check if username and password are provided
        if (!checkPasswordCriteria(req.body.password)) {
            return res.status(400).json("Password does not meet the criteria.");
        }

        // Check if username is already taken
        const usernameExists = await checkUsernameExists(req.body.username);
        if (usernameExists) {
            return res.status(400).json("Username is already taken.");
        }

        // Hash the password
       // Hash the password
const saltRounds = 10; // Number of salt rounds for bcrypt
const hashPassword = await bcrypt.hash(req.body.password, saltRounds);


        // Get the file path of the uploaded profile picture
        const profilePicPath = req.file ? req.file.path : null;

        // Insert new user into MySQL
        const newUser = {
            username: req.body.username,
            password: hashPassword,
            name: req.body.name || null,
            profile_pic: profilePicPath // Store the file path in the database
        };

        await insertUser(newUser);

        console.log('New user inserted into MySQL');
        res.redirect('/users');
    } catch (err) {
        return next(err);
    }
});

function checkPasswordCriteria(password) {
    // Regular expressions to match criteria
    const hasCapitalLetter = /[A-Z]/.test(password);
    const hasSpecialCharacter = /[!@#$%^&*()-_=+{};:,<.>?`~]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    // Check if all criteria are met
    return hasCapitalLetter && hasSpecialCharacter && hasNumber;
}

router.post('/login', async function(req, res, next) {
  try {
      console.log(req.body.password, req.body.username);

      const [userRows] = await query('SELECT * FROM users WHERE username = ?', [req.body.username]);
      if (userRows) {
        const user = userRows;

          const valid = await bcrypt.compare(req.body.password, user.password);
          
          if (valid) {
              req.session.loggedIn = true;
              req.session.user = user.id;
              res.redirect(`/users/${user.id}`);
          } else {
              res.status(200).json("Wrong password");
          }
      } else {
          res.status(200).json("User not found");
      }
  } catch (err) {
      next(err);
  }
});
router.get('/logout', async function (req,res,next){
  req.session.destroy();
  res.redirect('/users');
})
router.get('/:id', async function (req, res, next) {
  try {
    const userId = req.params.id;

    const [userRows] = await query('SELECT * FROM users WHERE id = ?', [userId]);
    const coursesQuery = `
      SELECT * FROM courses 
      WHERE id NOT IN (
        SELECT course_id FROM UserCourses WHERE user_id = ?
      )
    `;
    const courseRows = await query(coursesQuery, [userId]);
    console.log(courseRows);

    const userCoursesQuery = `
      SELECT courses.* FROM courses
      INNER JOIN UserCourses ON courses.id = UserCourses.course_id
      WHERE UserCourses.user_id = ?
    `;
    
    // Execute the query to fetch courses the user has enrolled in
    const userCoursesRows = await query(userCoursesQuery, [userId]);
    if (userRows) {
      const user = userRows;
      if (!user.profile_pic) {
        user.profile_pic = 'image.png'; 
      }
      console.log(user);
      if (courseRows) {
        res.render('profile.hbs', { user, courses: courseRows ,userCourses: userCoursesRows });
      } else {
        res.render('profile.hbs', { user, message: 'No courses found' ,message1: 'No courses enrolled' });
      }
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    next(err);
  }
});

// Route to handle course selection
router.post('/selectCourse/:courseId', async (req, res, next) => {
  try {
      // Extract the course ID from the request parameters
      const courseId = req.params.courseId;

      // Retrieve the user ID from the session or request
      const userId = req.session.user; // Assuming you store the user ID in the session

      // Insert a new record into the UserCourses table
      await insertUserCourse(userId, courseId);

      // Redirect the user to a success page or back to the course list
      res.redirect(`/users/${userId}`);
  } catch (err) {
      next(err); // Forward the error to the error handling middleware
  }
});

router.post('/unenrollCourse/:courseId', async (req, res, next) => {
  try {
      const courseId = req.params.courseId;
      const userId = req.session.user;

      // Delete the record from the UserCourses table
      await deleteUserCourse(userId, courseId);

      res.redirect(`/users/${userId}`); // Redirect to user profile page
  } catch (err) {
      next(err);
  }
});

router.get('/courses/:courseId', async function(req, res, next) {
  try {
    const courseId = req.params.courseId;
    const userId = req.session.user; // Assuming you store the user ID in the session

    // Query to check if the user is enrolled in the course
    const userCourseQuery = `
      SELECT courses.course_name, courses.description, usercourses.* 
      FROM usercourses 
      INNER JOIN courses ON usercourses.course_id = courses.id 
      WHERE usercourses.user_id = ? AND usercourses.course_id = ?
    `;
    const [userCourseRows] = await query(userCourseQuery, [userId, courseId]);
    console.log(userCourseRows);
    // Check if the course exists and if the user is enrolled
    if (userCourseRows) {
      res.render('courses.hbs', { userCourses : [userCourseRows] });
    } else {
      {res.render('courses.hbs', { message: 'No courses found', message1: 'No courses enrolled' });
    }
  }} catch (err) {
    next(err); // Forward the error to the error handling middleware
  }
});


router.get('/uncourses/:courseId', async function(req, res, next) {
  try {
    const courseId = req.params.courseId;
    const userId = req.session.user; // Assuming you store the user ID in the session

    // Query to get the course details by ID
    const courseQuery = 'SELECT * FROM courses WHERE id = ?';
    const [courseRows] = await query(courseQuery, [courseId]);
    console.log(courseRows);
    // Check if the course exists and if the user is enrolled
    if (courseRows) {
      res.render('uncourses.hbs', { courses : [courseRows] });
    } else {
      res.status(404).json({ error: 'Course not found' });
    }
  } catch (err) {
    next(err); // Forward the error to the error handling middleware
  }
});

// Assuming you have a route handler for '/users/nextsession/:userCourseId'
router.post('/nextsession/:userCourseId', async (req, res, next) => {
  try {
    const userCourseId = req.params.userCourseId;

    // Fetch the current progress of the course from the database
    const [userCourseRows] = await query('SELECT * FROM usercourses WHERE user_course_id = ?', [userCourseId]);
    if (!userCourseRows) {
      return res.status(404).json({ error: 'User course not found' });
    }

    // Increment the progress by 10%
    const currentProgress = userCourseRows.progress;
    const newProgress = Math.min(currentProgress + 10, 100); // Ensure progress doesn't exceed 100%

    const [CourseId] = await query('SELECT course_id FROM usercourses WHERE user_course_id = ?', [userCourseId]);
    // Update the progress in the database
    await query('UPDATE usercourses SET progress = ? WHERE user_course_id = ?', [newProgress, userCourseId]);

    // Redirect the user to the user profile page or any other relevant page
    console.log(CourseId);
    res.redirect(`/users/courses/${CourseId.course_id}`);
  } catch (err) {
    next(err);
  }
});

router.post('/nextsession/:userCourseId', async (req, res, next) => {
  try {
    const userCourseId = req.params.userCourseId;

    // Fetch the current progress of the course from the database
    const [userCourseRows] = await query('SELECT * FROM usercourses WHERE user_course_id = ?', [userCourseId]);
    if (!userCourseRows) {
      return res.status(404).json({ error: 'User course not found' });
    }

    // Increment the progress by 10%
    const currentProgress = userCourseRows.progress;
    const newProgress = Math.min(currentProgress + 10, 100); // Ensure progress doesn't exceed 100%

    // Check if progress is 100 and update is_complete accordingly
    const isComplete = newProgress === 100 ? 1 : 0;

    // Update the progress and is_complete in the database
    await query('UPDATE usercourses SET progress = ?, is_complete = ? WHERE user_course_id = ?', [newProgress, isComplete, userCourseId]);

    // Check if progress is changed to 1
    if (newProgress === 1) {
      // Redirect to user profile page
      return res.redirect(`/users/${req.session.user_id}`);
    }

    const [CourseId] = await query('SELECT course_id FROM usercourses WHERE user_course_id = ?', [userCourseId]);
    // Redirect the user to the course page
    res.redirect(`/users/courses/${CourseId.course_id}`);

  } catch (err) {
    next(err);
  }
});



module.exports = router;



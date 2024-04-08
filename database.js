const mysql = require('mysql2');

const pool = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '1234',
    database: 'codejnr'
});

// Function to execute a SQL query
const query = async (sql, values) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, values, (error, results, fields) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};


// Function to insert a new user course
const insertUserCourse = async (userId, courseId) => {
    const sql = 'INSERT INTO usercourses (user_id, course_id) VALUES (?, ?)';
    return query(sql, [userId, courseId]);
};



// Function to insert a new user
const insertUser = async (newUser) => {
    const sql = 'INSERT INTO users SET ?';
    return query(sql, newUser);
};

// Function to check if a username already exists
const checkUsernameExists = async (username) => {
    const sql = 'SELECT * FROM users WHERE username = ?';
    const results = await query(sql, [username]);
    return results.length > 0;
};

const deleteUserCourse = async (userId, courseId) => {
    const sql = 'DELETE FROM usercourses WHERE user_id = ? AND course_id = ?';
    return query(sql, [userId, courseId]);
};

module.exports = {
    insertUser,
    checkUsernameExists,query,insertUserCourse,deleteUserCourse
};
// Import necessary modules and packages.
const passport = require('passport'),                    // Import Passport for authentication.
  LocalStrategy = require('passport-local').Strategy,   // Import the LocalStrategy for username and password authentication.
  Models = require('./models.js'),                     // Import your user model from 'models.js'.
  passportJWT = require('passport-jwt');              // Import passport-jwt for JWT authentication.



// Import User model from your 'models.js' file.
let Users = Models.User,


// Import JWTStrategy and ExtractJWT from 'passport-jwt' for JWT authentication.
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJwt;



  passport.use(
    new LocalStrategy(
      {
        usernameField: 'Username',
        passwordField: 'Password',
      },
      async (username, password, callback) => {
        console.log(`${username} ${password}`);
        await Users.findOne({ Username: username })
        .then((user) => {
          if (!user) {
            console.log('incorrect username');
            return callback(null, false, {
              message: 'Incorrect username or password.',
            });
          }
          if (!user.validatePassword(password)) {
            console.log('incorrect password');
            return callback(null, false, { message: 'Incorrect password.' });
          }
          console.log('finished');
          return callback(null, user);
        })
        .catch((error) => {
          if (error) {
            console.log(error);
            return callback(error);
          }
        })
      }
    )
  );


// Configure the JWT Strategy for token-based authentication.
passport.use(new JWTStrategy({ // Extract the JWT from the "Authorization" header as a bearer token.

  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),   // Specify your JWT secret key for verification.

  secretOrKey: 'your_jwt_secret'
}, async (jwtPayload, callback) => {
    
  return await Users.findById(jwtPayload._id)  // Find a user by their _id from the JWT payload.
    .then((user) => {
                            // Provide the user as a result if found.
      return callback(null, user);
    })
    .catch((error) => {  // Handle any errors that may occur during the process.
      return callback(error)
    });
}));


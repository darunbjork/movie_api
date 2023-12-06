const mongoose = require('mongoose');  
const express = require('express');     
const morgan = require('morgan');   
const fs = require('fs');    
const path = require('path');   
const bodyParser = require('body-parser');  
const app = express();  
const cors = require('cors');
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));   
let auth = require('./auth')(app);  
const passport = require('passport');  
                 require('./passport'); 
const uuid = require('uuid');   
const { title } = require('process'); 
const Models = require('./models.js');   
const Users = Models.User;   
const Movies = Models.Movie;  

const Schema = mongoose.Schema;


require('dotenv').config();





const directorSchema = new Schema({
  Name: String,       
  bio: String,        
  birthYear: Number,   
  deathYear: Number    
});


const Director = mongoose.model('Director', directorSchema);



const { check, validationResult } = require('express-validator');



mongoose.connect('mongodb://localhost:27017/myFlix')
  .then(() => {
    console.log('Connected to MongoDB'); 
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error); 
  }); 

/*
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });
*/


const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });

app.use(morgan('common', { stream: accessLogStream }));


app.use(express.static(path.join(__dirname, 'public')));


app.use(express.urlencoded({ extended: true }));


app.use(express.json());
app.use(bodyParser.json()); 


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});





app.get('/', (req, res) => {
  
  res.send('Welcome to my myFlix web application.');
});



app.get('/users', passport.authenticate('jwt', {session: false}), async (req, res) => {
  await Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});





app.get('/movies',  async (req, res) => {
  await Movies.find()
    .then((movies) => {
      res.status(200).json(movies);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});




app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), async (req, res) => {

  await Movies.findOne({ Title: req.params.Title })
    .populate('Genre') 
    .populate('Director') 
    .then((movie) => {
      if (!movie) {
        return res.status(404).send('Movie not found');
      }

      const movieData = {
        Description: movie.Description,
        Genre: movie.Genre.Name,
        Director: movie.Director.Name,
        ImageURL: movie.ImageURL,
        Featured: movie.Featured
      };

      res.json(movieData);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});


app.get('/movies/genre/:Genre', passport.authenticate('jwt', { session: false }), async (req, res) => {

  await Movies.find({ 'Genre.Name': req.params.Genre })
    .then((movies) => {
      if (movies.length === 0) {
        return res.status(404).send('No movies found for this genre');
      }

      const movieData = movies.map((movie) => ({
        Title: movie.Title,
        Description: movie.Description,
        Genre: movie.Genre.Name,
        Director: movie.Director.Name,
        ImageURL: movie.ImageURL,
        Featured: movie.Featured,
      }));

      res.json(movieData);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});


app.get('/movies/director/:Director', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.find({ 'Director.Name': req.params.Director })
   .then((movies) => {
     if (movies.length === 0) {
       return res.status(404).send('No movies found for this director');
     }

     const movieData = movies.map((movie) => ({
       Title: movie.Title,
       Description: movie.Description,
       Genre: movie.Genre.Name,
       Director: movie.Director.Name,
       ImageURL: movie.ImageURL,
       Featured: movie.Featured,
     }));

 
     res.json(movieData);
   })
   .catch((error) => {
     console.error(error);
     res.status(500).send('Error: ' + error);
   });
});



app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Users.findOneAndUpdate(
    { Username: req.params.Username },
    { $pull: { FavoriteMovies: req.params.MovieID } }
  )
    .then((result) => {
      if (!result) {
        return res.status(404).send('User not found');
      }
      res.json(result);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});



app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Users.findOneAndDelete({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});




app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Users.findOneAndUpdate(
    { Username: req.params.Username },
    { $push: { FavoriteMovies: req.params.MovieID } },
    { new: true }
  )
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});



app.post('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const updatedUser = await Users.findOneAndUpdate(
      { Username: req.params.Username },
      { $push: { FavoriteMovies: req.body.MovieID } }, 
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send('User not found');
    }


    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err.message);
  }
});



app.post('/users',
  [
    check('Username', 'Username must be at least 5 characters long').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
  ], async (req, res) => {

  // check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOne({ Username: req.body.Username }) // Search to see if a user with the requested username already exists
      .then((user) => {
        if (user) {
          //If the user is found, send a response that it already exists
          return res.status(400).send(req.body.Username + ' already exists');
        } else {
          Users
            .create({
              Username: req.body.Username,
              Password: hashedPassword,
              Email: req.body.Email,
              Birthday: req.body.Birthday
            })
            .then((user) => { res.status(201).json(user) })
            .catch((error) => {
              console.error(error);
              res.status(500).send('Error: ' + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  });




/*

app.put('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  if (req.user.Username !== req.params.Username) {
    return res.status(400).send('Permission denied');
  }
  await Users.findOneAndUpdate({ Username: req.params.Username }, {
    $set: {
      Username: req.body.Username,
      Password: req.body.Password,
      Email: req.body.Email,
      Birthday: req.body.Birthday
    }
  },
    { new: true }) 
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send('Error: ' + err);
    });
});




  app.put('/users/:Username', 
  [
    check('Username', 'Username is required').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
  ], passport.authenticate('jwt', { session: false }), async (req, res) => {
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  let hashedPassword = Users.hashPassword(req.body.Password);
  await Users.findOneAndUpdate({ Username: req.params.Username }, { $set:
    {
      Username: req.body.Username,
      Password: hashedPassword,
      Email: req.body.Email,
      Birthday: req.body.Birthday
    }
  },
  { new: true }) // This line makes sure that the updated document is returned
  .then((updatedUser) => {
    res.json(updatedUser);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send("Error: " + err);
  })
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
*/


app.put('/users/:Username',
  [
    check('Username', 'Username must be at least 5 characters long').isLength({ min: 5 }),
    check('Username', 'Username contains invalid characters. Only letters, numbers, hyphens, and underscores are allowed.').matches(/^[a-zA-Z0-9-_]+$/),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
  ], passport.authenticate('jwt', { session: false }), async (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    if (req.user.Username !== req.params.Username) {
      return res.status(400).send('Permission denied');
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
      $set: {
        Username: req.body.Username,
        Password: hashedPassword,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      }
    }, { new: true })
      .then((updatedUser) => {
        res.json(updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });



const port = process.env.PORT || 8080;

app.listen(port, '0.0.0.0', () => {
  console.log('Listening on Port ' + port);
});


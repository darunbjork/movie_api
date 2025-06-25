require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const Models = require('./models.js');
const SmartHomeModels = require('./smartHomeModels.js');
const passport = require('passport');
const cors = require('cors');
const { check, validationResult } = require('express-validator');
require('./passport');
const app = express();

const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:1234', // Update this with your frontend origin
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const Movies = Models.Movie;
const Devices = SmartHomeModels.Device;
const Users = Models.User;
 const allowedOrigins = [
   'http://localhost:8080',
   'http://localhost:1234',
   'http://localhost:3000',
   'http://localhost:5000',
   'http://testsite.com',
   'http://localhost:4200',
   'https://cinemahub22.netlify.app',
  'https://flix-movie-hub.netlify.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(morgan('common'));
app.use(express.static('public'));
app.use(cors(corsOptions));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to the database');
  })
  .catch((err) => {
    console.error('Error connecting to the database', err);
  });

let auth = require('./auth')(app);

app.get('/', (req, res) => {
  res.send('Welcome to the Smart Home Automation API!');
});

app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const movies = await Movies.find();
    res.status(200).json(movies);
  } catch (err) {
    next(err);
  }
});

app.get('/movies/title/:Title', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const movie = await Movies.findOne({ Title: req.params.Title });
    if (movie) {
      res.status(200).json(movie);
    } else {
      res.status(404).json({ error: 'Movie not found' });
    }
  } catch (err) {
    next(err);
  }
});

app.get('/movies/genre/:Genre', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const movies = await Movies.find({ 'Genre.Name': req.params.Genre });
    if (movies.length > 0) {
      res.status(200).json(movies);
    } else {
      res.status(404).json({ error: 'No movies found for this genre' });
    }
  } catch (err) {
    next(err);
  }
});
app.get('/movies/director/:Director', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const movies = await Movies.find({ 'Director.Name': req.params.Director });
    if (movies.length > 0) {
      res.status(200).json(movies);
    } else {
      res.status(404).json({ error: 'No movies found for this director' });
    }
  } catch (err) {
    next(err);
  }
});
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    if (req.user.Username !== req.params.Username) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    const user = await Users.findOne({ Username: req.params.Username });
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ error: `${req.params.Username} not found` });
    }
  } catch (err) {
    next(err);
  }
});
app.post('/users', [
  check('Username', 'Username is required').isLength({ min: 5 }),
  check('Username', 'Username contains non-alphanumeric characters - not allowed.').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail()
], async (req, res) => {
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  let hashedPassword = Users.hashPassword(req.body.Password);
  await Users.findOne({ Username: req.body.Username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.Username + ' already exists');
      } else {
        Users.create({
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday
        })
          .then((user) => { res.status(201).json(user); })
          .catch((error) => { res.status(500).send('Error: ' + error); });
      }
    })
    .catch((error) => { res.status(500).send('Error: ' + error); });
});
app.put('/users/:Username', passport.authenticate('jwt', { session: false }), [
  check('Username', 'Username is required').isLength({ min: 5 }),
  check('Username', 'Username contains non-alphanumeric characters - not allowed.').isAlphanumeric(),
  check('Password', 'Password is required').not().isEmpty(),
  check('Email', 'Email does not appear to be valid').isEmail()
], async (req, res) => {
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  if (req.user.Username !== req.params.Username) {
    return res.status(400).send('Permission denied');
  }
  
  let hashedPassword = Users.hashPassword(req.body.Password);
  
  await Users.findOneAndUpdate(
    { Username: req.params.Username },
    {
      $set: {
        Username: req.body.Username,
        Password: hashedPassword,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      }
    },
    { new: true }
  )
    .then((updatedUser) => { res.json(updatedUser); })
    .catch((err) => { res.status(500).send('Error: ' + err); });
});
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  if (req.user.Username !== req.params.Username) {
    return res.status(400).send('Permission denied');
  }
  try {
    const updatedUser = await Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $push: { FavoriteMovies: req.params.MovieID },
      },
      { new: true }
    );
    if (updatedUser) {
      res.status(200).json(updatedUser);
    } else {
      res.status(404).json({ error: `${req.params.Username} not found` });
    }
  } catch (err) {
    next(err);
  }
});
app.get('/users/:Username/movies', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    if (req.user.Username !== req.params.Username) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    const user = await Users.findOne({ Username: req.params.Username }).populate('FavoriteMovies');
    if (user) {
      res.status(200).json(user.FavoriteMovies);
    } else {
      res.status(404).json({ error: `${req.params.Username} not found` });
    }
  } catch (err) {
    next(err);
  }
});
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  if (req.user.Username !== req.params.Username) {
    return res.status(400).send('Permission denied');
  }
  try {
    const updatedUser = await Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $pull: { FavoriteMovies: req.params.MovieID },
      },
      { new: true }
    );
    if (updatedUser) {
      res.status(200).json(updatedUser);
    } else {
      res.status(404).json({ error: `${req.params.Username} not found` });
    }
  } catch (err) {
    next(err);
  }
});
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  if (req.user.Username !== req.params.Username) {
    return res.status(400).send('Permission denied');
  }
  try {
    const user = await Users.findOneAndDelete({ Username: req.params.Username });
    if (!user) {
      res.status(404).json({ error: `${req.params.Username} not found` });
    } else {
      res.status(200).json({ message: `${req.params.Username} was deleted.` });
    }
  } catch (err) {
    next(err);
  }
});
app.get('/devices', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const devices = await Devices.find();
    res.status(200).json(devices);
  } catch (err) {
    next(err);
  }
});

// In your backend routes
app.put('/devices/:id/brightness', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  const deviceId = req.params.id;
  const { brightness } = req.body;

  try {
    const updatedDevice = await Devices.findByIdAndUpdate(deviceId, { Brightness: brightness }, { new: true });
    if (updatedDevice) {
      io.emit('deviceBrightnessChanged', updatedDevice);
      res.status(200).json(updatedDevice);
    } else {
      res.status(404).json({ error: 'Device not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



app.get('/devices/name/:Name', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const device = await Devices.findOne({ Name: req.params.Name });
    if (device) {
      res.status(200).json(device);
    } else {
      res.status(404).json({ error: 'Device not found' });
    }
  } catch (err) {
    next(err);
  }
});
app.get('/devices/type/:Type', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const devices = await Devices.find({ Type: req.params.Type });
    if (devices.length > 0) {
      res.status(200).json(devices);
    } else {
      res.status(404).json({ error: 'No devices found for this type' });
    }
  } catch (err) {
    next(err);
  }
});
app.post('/devices', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const newDevice = await Devices.create(req.body);
    res.status(201).json(newDevice);
  } catch (err) {
    next(err);
  }
});
app.put('/devices/:id', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const updatedDevice = await Devices.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (updatedDevice) {
      res.status(200).json(updatedDevice);
    } else {
      res.status(404).json({ error: 'Device not found' });
    }
  } catch (err) {
    next(err);
  }
});
app.delete('/devices/:id', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const deletedDevice = await Devices.findByIdAndDelete(req.params.id);
    if (deletedDevice) {
      res.status(200).json({ message: 'Device deleted successfully' });
    } else {
      res.status(404).json({ error: 'Device not found' });
    }
  } catch (err) {
    next(err);
  }
});
app.put('/devices/:id/status', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const deviceId = req.params.id;
    const newStatus = req.body.status;
    console.log('Token:', req.headers.authorization); // Log the token
    console.log('Authenticated user:', req.user); // Log the authenticated user
    const updatedDevice = await Devices.findByIdAndUpdate(deviceId, { Status: newStatus }, { new: true });
    if (updatedDevice) {
      io.emit('deviceStatusChanged', updatedDevice);
      res.status(200).json(updatedDevice);
    } else {
      res.status(404).json({ error: 'Device not found' });
    }
  } catch (err) {
    next(err);
  }
});
app.get('/error', (req, res) => {
  throw new Error('This is a simulated error.');
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.name === 'ValidationError') {
    res.status(400).json({ error: `Validation Error: ${err.message}` });
  } else if (err.name === 'MongoError') {
    res.status(500).json({ error: `Database Error: ${err.message}` });
  } else if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` });
  } else {
    res.status(500).json({ error: 'Something broke!' });
  }
});
const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Your app is listening on port ${port}.`);
});